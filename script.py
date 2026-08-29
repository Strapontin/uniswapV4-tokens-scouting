import json
import os
from datetime import datetime
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()


def normalize_token_id(token_id: str) -> str:
    value = token_id.strip().lower().removeprefix("0x")
    return f"0x{value.zfill(64)}"


def get_pool_initialize_logs(token_id: str, chain_id: int | str = 130):
    api_key = os.getenv("ETHERSCAN_API")
    if not api_key:
        raise ValueError("ETHERSCAN_API is not set in the environment or .env file")

    token = normalize_token_id(token_id)
    base_params = {
        "chainid": str(chain_id),
        "apikey": api_key,
        "module": "logs",
        "action": "getLogs",
        "address": "0x1f98400000000000000000000000000000000004",
        "fromBlock": "25565",
        "toBlock": "latest",
        "topic0": "0xdd466e674ea557f56295e2d0218a125ea4b4f0f6f3307b95f85e6110838d6438",
        "topic0_2_opr": "and",
    }

    results = []
    for topic_key in ("topic2", "topic3"):
        params = {**base_params, topic_key: token}
        response = requests.get("https://api.etherscan.io/v2/api", params=params, timeout=30)
        response.raise_for_status()
        payload = response.json()
        results.extend(payload.get("result", []))

    unique_results = {}
    for log in results:
        row_key = f"{log.get('transactionHash')}:{log.get('logIndex')}"
        unique_results[row_key] = log

    return {
        "status": "1",
        "message": "OK",
        "result": list(unique_results.values()),
    }


def save_logs_to_json(token_id: str = "token", chain_id: int | str = 130):
    result = get_pool_initialize_logs(token_id, chain_id=chain_id)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    payload = {
        "generated_at": timestamp,
        "token_id": token_id,
        "chain_id": str(chain_id),
        "data": result,
    }

    base_dir = Path(__file__).resolve().parent / "pool-initialize-viewer" / "data"
    output_dir = base_dir / str(chain_id)
    output_dir.mkdir(parents=True, exist_ok=True)

    file_name = f"pool_initialize_logs_{token_id}.json"
    output_path = output_dir / file_name
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload, str(output_path)


if __name__ == "__main__":
    token_id = "927B51f251480a681271180DA4de28D44EC4AfB8"
    result, file_name = save_logs_to_json(token_id)

    print("Pool Initialize Logs")
    print("-" * 40)
    print(f"Generated at: {result.get('generated_at')}")
    print(f"Token ID: {result.get('token_id')}")
    print(f"Status: {result.get('data', {}).get('status')}")
    print(f"Message: {result.get('data', {}).get('message')}")
    print(f"Result count: {len(result.get('data', {}).get('result', []))}")
    print(f"Saved to: {Path(file_name).resolve()}")

    for i, log in enumerate(result.get("data", {}).get("result", []), start=1):
        print(f"\nLog #{i}")
        print(f"  blockNumber: {log.get('blockNumber')}")
        print(f"  txHash: {log.get('transactionHash')}")
        print(f"  address: {log.get('address')}")
        print(f"  topics: {log.get('topics')}")
