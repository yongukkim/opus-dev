import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { Abi, AbiFunction } from "viem";
import { createPublicClient, createWalletClient, http, parseGwei } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { LEDGER_FILES, ONCHAIN_MINT_RETRY_POLICY } from "@/lib/ledgerStores";
import { appendJsonl, type SubmissionRecord } from "@/lib/privateStorage";

/** On-chain mint execution queue + policy snapshots — path: `LEDGER_FILES.onchainMintJobs` (not submission truth). */
const MINT_JOBS_FILE = LEDGER_FILES.onchainMintJobs;
const MAX_ATTEMPTS = ONCHAIN_MINT_RETRY_POLICY.maxAttempts;
const RETRY_BASE_MS = ONCHAIN_MINT_RETRY_POLICY.baseDelayMs;
const RETRY_MAX_MS = ONCHAIN_MINT_RETRY_POLICY.maxDelayMs;

export type OnchainMintJobStatus = "queued" | "submitted" | "confirmed" | "failed";

export type OnchainMintMode = "anchor_tx" | "erc721_safe_mint" | "contract_write";

export type OnchainMintJob = {
  id: string;
  idempotencyKey: string;
  submissionId: string;
  artistId: string;
  editionTotal: number;
  initialMint: number;
  attemptCount: number;
  nextAttemptAt: string;
  lastError?: string;
  network: string;
  walletPolicy: "server_custodial";
  gasPolicy: {
    mode: "eip1559";
    maxFeeGwei: number;
    maxPriorityFeeGwei: number;
  };
  mintMode: OnchainMintMode;
  contractAddress?: `0x${string}`;
  tokenUriBase?: string;
  /** JSON string of full ABI array (audit snapshot for `contract_write`). */
  mintContractAbiJson?: string;
  mintFunctionName?: string;
  /** JSON string of args array; strings may contain `{{placeholders}}`. */
  mintArgsTemplateJson?: string;
  txHash?: string;
  chainId?: number;
  status: OnchainMintJobStatus;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
};

type MintGatewayResult = {
  txHash: string;
  chainId: number;
  network: string;
};

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw?.trim()) return fallback;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function selectedNetwork(): { network: string; chainId: number } {
  const network = process.env["OPUS_CHAIN_NETWORK"]?.trim() || "polygon-amoy";
  const chainId = Number.parseInt(process.env["OPUS_CHAIN_ID"]?.trim() || "80002", 10);
  return { network, chainId: Number.isFinite(chainId) ? chainId : 80002 };
}

function selectedMintMode(): OnchainMintMode {
  const raw = process.env["OPUS_MINT_MODE"]?.trim() || "anchor_tx";
  if (raw === "erc721_safe_mint") return "erc721_safe_mint";
  if (raw === "contract_write") return "contract_write";
  return "anchor_tx";
}

function submissionMintIdempotencyKey(submissionId: string): string {
  return createHash("sha256").update(`mint:${submissionId}`, "utf8").digest("hex");
}

function normalizeHexAddress(raw: string): `0x${string}` {
  const t = raw.trim();
  const with0x = t.startsWith("0x") ? t : `0x${t}`;
  if (!/^0x[a-fA-F0-9]{40}$/.test(with0x)) throw new Error("invalid_address");
  return with0x as `0x${string}`;
}

function tplReplaceAll(template: string, ctx: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => ctx[key] ?? "");
}

function expandPlaceholders(value: unknown, ctx: Record<string, string>): unknown {
  if (typeof value === "string") return tplReplaceAll(value, ctx);
  if (Array.isArray(value)) return value.map((v) => expandPlaceholders(v, ctx));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = expandPlaceholders(v, ctx);
    }
    return out;
  }
  return value;
}

function findAbiFunction(abi: Abi, name: string): AbiFunction {
  const fn = abi.find((item): item is AbiFunction => item.type === "function" && item.name === name);
  if (!fn) throw new Error("mint_abi_function_missing");
  return fn;
}

function coerceArg(value: unknown, solidityType: string): unknown {
  const t = solidityType.trim();
  if (t === "address") {
    if (typeof value !== "string") throw new Error("mint_arg_address");
    return normalizeHexAddress(value);
  }
  if (t === "bool") {
    if (typeof value !== "boolean") throw new Error("mint_arg_bool");
    return value;
  }
  if (t === "string") {
    if (typeof value !== "string") throw new Error("mint_arg_string");
    return value;
  }
  if (t === "bytes" || t === "bytes32") {
    if (typeof value !== "string" || !value.startsWith("0x")) throw new Error("mint_arg_bytes");
    return value as `0x${string}`;
  }
  if (/^u?int\d+$/.test(t)) {
    if (typeof value === "number" && Number.isFinite(value)) return BigInt(Math.trunc(value));
    if (typeof value === "string" && value.trim()) return BigInt(value.trim());
    throw new Error("mint_arg_integer");
  }
  throw new Error(`mint_arg_unsupported_type:${t}`);
}

function coerceArgsForFunction(fn: AbiFunction, args: unknown[]): readonly unknown[] {
  if (!Array.isArray(args)) throw new Error("mint_args_not_array");
  if (args.length !== fn.inputs.length) throw new Error("mint_args_length_mismatch");
  return fn.inputs.map((input, i) => coerceArg(args[i], input.type));
}

async function readMintJobs(): Promise<OnchainMintJob[]> {
  try {
    const raw = await readFile(MINT_JOBS_FILE, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as OnchainMintJob);
  } catch {
    return [];
  }
}

async function latestJobBySubmission(submissionId: string): Promise<OnchainMintJob | null> {
  const rows = await readMintJobs();
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    if (rows[i]?.submissionId === submissionId) return rows[i] ?? null;
  }
  return null;
}

function retryDelayMs(attemptCount: number): number {
  const exp = Math.max(0, attemptCount - 1);
  const backoff = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** exp);
  return backoff;
}

function mintPlaceholderContext(job: OnchainMintJob, operatorAddress: `0x${string}`): Record<string, string> {
  const recipientRaw = process.env["OPUS_MINT_RECIPIENT_ADDRESS"]?.trim() || operatorAddress;
  const recipient = recipientRaw.startsWith("0x") ? recipientRaw : `0x${recipientRaw}`;
  const tokenUriBase = job.tokenUriBase || process.env["OPUS_MINT_TOKEN_URI_BASE"]?.trim() || "https://opus.invalid/token/";
  const tokenUri = `${tokenUriBase.replace(/\/$/, "")}/${encodeURIComponent(job.submissionId)}`;
  const submissionHash = createHash("sha256").update(job.submissionId, "utf8").digest("hex");
  return {
    submissionId: job.submissionId,
    artistId: job.artistId,
    editionTotal: String(job.editionTotal),
    initialMint: String(job.initialMint),
    idempotencyKey: job.idempotencyKey,
    jobId: job.id,
    operatorAddress,
    recipient,
    tokenUri,
    submissionHash,
  };
}

async function sendMintTxWithPolicy(job: OnchainMintJob): Promise<MintGatewayResult> {
  const simulate = process.env["OPUS_ONCHAIN_SIMULATE"] !== "0";
  if (simulate) {
    const { chainId, network } = selectedNetwork();
    const txHash = `0x${createHash("sha256")
      .update(`${job.id}:${job.attemptCount}:${Date.now()}`, "utf8")
      .digest("hex")}`;
    return { txHash, chainId, network };
  }
  const rpcUrl = process.env["OPUS_CHAIN_RPC_URL"]?.trim() ?? "";
  const pk = process.env["OPUS_ONCHAIN_OPERATOR_PRIVATE_KEY"]?.trim() ?? "";
  if (!rpcUrl || !pk) {
    throw new Error("onchain_gateway_not_configured");
  }
  const privateKey = pk.startsWith("0x") ? pk : `0x${pk}`;
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const transport = http(rpcUrl, { timeout: 20_000 });
  const publicClient = createPublicClient({ transport });
  const walletClient = createWalletClient({ account, transport });

  const expected = selectedNetwork();
  const chainId = await publicClient.getChainId();
  if (chainId !== expected.chainId) {
    throw new Error(`chain_mismatch:${chainId}`);
  }
  const maxFeePerGas = parseGwei(String(job.gasPolicy.maxFeeGwei));
  const maxPriorityFeePerGas = parseGwei(String(job.gasPolicy.maxPriorityFeeGwei));

  let txHash: `0x${string}`;
  if (job.mintMode === "contract_write") {
    if (!job.contractAddress) throw new Error("mint_contract_missing");
    if (!job.mintContractAbiJson || !job.mintFunctionName || !job.mintArgsTemplateJson) {
      throw new Error("mint_contract_write_incomplete");
    }
    let abi: Abi;
    try {
      abi = JSON.parse(job.mintContractAbiJson) as Abi;
    } catch {
      throw new Error("mint_abi_invalid_json");
    }
    let argsTemplate: unknown;
    try {
      argsTemplate = JSON.parse(job.mintArgsTemplateJson);
    } catch {
      throw new Error("mint_args_invalid_json");
    }
    const fn = findAbiFunction(abi, job.mintFunctionName);
    const ctx = mintPlaceholderContext(job, account.address);
    const expanded = expandPlaceholders(argsTemplate, ctx);
    if (!Array.isArray(expanded)) throw new Error("mint_args_not_array");
    const args = coerceArgsForFunction(fn, expanded);

    txHash = await walletClient.writeContract({
      account,
      chain: null,
      address: job.contractAddress,
      abi,
      functionName: job.mintFunctionName,
      args: args as never,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
  } else if (job.mintMode === "erc721_safe_mint") {
    if (!job.contractAddress) throw new Error("mint_contract_missing");
    const recipientRaw = process.env["OPUS_MINT_RECIPIENT_ADDRESS"]?.trim() || account.address;
    const recipient = (recipientRaw.startsWith("0x") ? recipientRaw : `0x${recipientRaw}`) as `0x${string}`;
    const tokenUriBase = job.tokenUriBase || "https://opus.invalid/token/";
    const tokenUri = `${tokenUriBase.replace(/\/$/, "")}/${encodeURIComponent(job.submissionId)}`;
    txHash = await walletClient.writeContract({
      account,
      chain: null,
      address: job.contractAddress,
      abi: [
        {
          type: "function",
          name: "safeMint",
          stateMutability: "nonpayable",
          inputs: [
            { name: "to", type: "address" },
            { name: "tokenURI", type: "string" },
          ],
          outputs: [],
        },
      ] as const,
      functionName: "safeMint",
      args: [recipient, tokenUri],
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
  } else {
    const submissionHash = createHash("sha256").update(job.submissionId, "utf8").digest("hex");
    const anchorPayload = `OPUS|ISSUED|${job.submissionId}|${submissionHash}|${job.attemptCount}`;
    const data = `0x${Buffer.from(anchorPayload, "utf8").toString("hex")}` as `0x${string}`;
    txHash = await walletClient.sendTransaction({
      account,
      chain: null,
      to: account.address,
      value: 0n,
      data,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
  }

  const confirms = Number.parseInt(process.env["OPUS_ONCHAIN_CONFIRMATIONS"]?.trim() || "1", 10);
  const timeoutMs = Number.parseInt(process.env["OPUS_ONCHAIN_RECEIPT_TIMEOUT_MS"]?.trim() || "120000", 10);
  await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: Number.isFinite(confirms) ? Math.max(1, confirms) : 1,
    timeout: Number.isFinite(timeoutMs) ? Math.max(20_000, timeoutMs) : 120_000,
  });
  return { txHash, chainId, network: expected.network };
}

/**
 * ISO 27001 A.12.4.1 (§5), A.13.1.3 (§6)
 * KO: 승인 시 민팅 작업을 idempotency 키로 한 번만 큐잉하고, 가스/네트워크 정책 스냅샷을 함께 보존합니다.
 * JA: 承認時にミントジョブを冪等キーで一度だけキュー投入し、ガス/ネットワーク方針スナップショットを保存します。
 * EN: Queue mint jobs exactly once per submission using an idempotency key, storing network/gas policy snapshots.
 */
export async function enqueueMintJobForApprovedSubmission(submission: SubmissionRecord): Promise<OnchainMintJob | null> {
  if (submission.reviewStatus !== "approved") return null;

  const existing = await latestJobBySubmission(submission.id);
  if (existing && existing.status !== "failed") return existing;

  const now = new Date().toISOString();
  const idempotencyKey = submissionMintIdempotencyKey(submission.id);
  const net = selectedNetwork();
  const mintMode = selectedMintMode();
  const contractAddress = process.env["OPUS_MINT_CONTRACT_ADDRESS"]?.trim();
  const abiRaw = process.env["OPUS_MINT_CONTRACT_ABI"]?.trim() ?? "";
  const fnName = process.env["OPUS_MINT_FUNCTION_NAME"]?.trim() ?? "";
  const argsRaw = process.env["OPUS_MINT_ARGS_JSON"]?.trim() ?? "";

  const job: OnchainMintJob = {
    id: `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}`,
    idempotencyKey,
    submissionId: submission.id,
    artistId: submission.artistId,
    editionTotal: submission.editionTotal,
    initialMint: submission.initialMint,
    attemptCount: 0,
    nextAttemptAt: now,
    network: net.network,
    walletPolicy: "server_custodial",
    gasPolicy: {
      mode: "eip1559",
      maxFeeGwei: envNumber("OPUS_MAX_FEE_GWEI", 40),
      maxPriorityFeeGwei: envNumber("OPUS_MAX_PRIORITY_FEE_GWEI", 2),
    },
    mintMode,
    contractAddress: contractAddress ? (contractAddress as `0x${string}`) : undefined,
    tokenUriBase: process.env["OPUS_MINT_TOKEN_URI_BASE"]?.trim() || undefined,
    status: "queued",
    createdAt: now,
    updatedAt: now,
  };

  if (mintMode === "erc721_safe_mint" && !job.contractAddress) {
    throw new Error("mint_contract_missing");
  }
  if (mintMode === "contract_write") {
    if (!job.contractAddress) throw new Error("mint_contract_missing");
    if (!abiRaw) throw new Error("mint_abi_missing");
    if (!fnName) throw new Error("mint_function_name_missing");
    if (!argsRaw) throw new Error("mint_args_missing");
    let abiParsed: Abi;
    try {
      abiParsed = JSON.parse(abiRaw) as Abi;
    } catch {
      throw new Error("mint_abi_invalid_json");
    }
    try {
      JSON.parse(argsRaw);
    } catch {
      throw new Error("mint_args_invalid_json");
    }
    findAbiFunction(abiParsed, fnName);
    job.mintContractAbiJson = abiRaw;
    job.mintFunctionName = fnName;
    job.mintArgsTemplateJson = argsRaw;
  }

  await appendJsonl(MINT_JOBS_FILE, job);
  return job;
}

/**
 * ISO 27001 A.12.4.1 (§5), A.13.1.3 (§6)
 * KO: 큐에서 기한이 된 작업만 처리하고, 실패 시 지수 백오프로 재시도 계획을 append-only로 남깁니다.
 * JA: 期限到来ジョブのみ処理し、失敗時は指数バックオフ再試行計画をappend-onlyで記録します。
 * EN: Process only due jobs and append retry plans with exponential backoff on failure.
 */
export async function processDueMintJobs(limit: number): Promise<{
  scanned: number;
  processed: number;
  submitted: number;
  confirmed: number;
  failed: number;
}> {
  const rows = await readMintJobs();
  const latest = new Map<string, OnchainMintJob>();
  for (const row of rows) {
    if (row?.submissionId) latest.set(row.submissionId, row);
  }
  const now = Date.now();
  const due = [...latest.values()]
    .filter((j) => (j.status === "queued" || j.status === "submitted") && Date.parse(j.nextAttemptAt) <= now)
    .sort((a, b) => (a.nextAttemptAt < b.nextAttemptAt ? -1 : 1))
    .slice(0, Math.max(0, limit));

  let submitted = 0;
  let confirmed = 0;
  let failed = 0;

  for (const job of due) {
    const attemptCount = job.attemptCount + 1;
    const updatedAt = new Date().toISOString();
    let submittedRow: OnchainMintJob | null = null;
    try {
      submittedRow = {
        ...job,
        attemptCount,
        status: "submitted",
        updatedAt,
      };
      await appendJsonl(MINT_JOBS_FILE, submittedRow);
      const tx = await sendMintTxWithPolicy(submittedRow);
      const patch: OnchainMintJob = {
        ...submittedRow,
        attemptCount,
        txHash: tx.txHash,
        chainId: tx.chainId,
        network: tx.network,
        status: "confirmed",
        confirmedAt: updatedAt,
        updatedAt,
        nextAttemptAt: updatedAt,
        lastError: undefined,
      };
      await appendJsonl(MINT_JOBS_FILE, patch);
      submitted += 1;
      confirmed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "mint_failed";
      const willRetry = attemptCount < MAX_ATTEMPTS;
      const nextAttemptAt = willRetry
        ? new Date(Date.now() + retryDelayMs(attemptCount)).toISOString()
        : updatedAt;
      const base = submittedRow ?? job;
      const patch: OnchainMintJob = {
        ...base,
        attemptCount,
        status: willRetry ? "queued" : "failed",
        nextAttemptAt,
        updatedAt,
        lastError: message.slice(0, 200),
      };
      await appendJsonl(MINT_JOBS_FILE, patch);
      if (!willRetry) failed += 1;
    }
  }

  return {
    scanned: latest.size,
    processed: due.length,
    submitted,
    confirmed,
    failed,
  };
}

export async function listRecentMintJobs(limit: number): Promise<OnchainMintJob[]> {
  const rows = await readMintJobs();
  const latest = new Map<string, OnchainMintJob>();
  for (const row of rows) {
    if (row?.submissionId) latest.set(row.submissionId, row);
  }
  return [...latest.values()]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, Math.max(0, limit));
}
