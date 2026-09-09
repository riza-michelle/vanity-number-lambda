# Vanity Number Lambda

Converts caller phone numbers into vanity spellings using dictionary word matching. Built with AWS SAM, Amazon Connect, and DynamoDB.

## How it works

When a caller dials in through Amazon Connect, the contact flow invokes a Lambda that converts their phone number into up to 3 vanity spellings using a pre-built word index. The top results are spoken back to the caller and saved to DynamoDB. A separate HTTP API exposes recent caller records.

## Lambda Functions

### `ConnectVanityNumberHandlerFunction`

**Trigger:** Amazon Connect contact flow

Receives the inbound caller's phone number, generates vanity number candidates scored by word quality, saves the top 5 to DynamoDB, and returns the top 3 to the contact flow to be read aloud.

**Returns:**
```json
{
  "status": "success",
  "message": "Hello! Here are your top vanity numbers. Option 1: 1-800-FLOWERS. ...",
  "vanityNumbers": ["1-800-FLOWERS", "1-800-FLOWER-7", "1-800-3-LOWERS"]
}
```

**Environment variables:**
| Variable | Description |
|---|---|
| `CALLER_RECORD_TABLE_NAME` | DynamoDB table name |
| `VANITY_NUMBERS_TO_SAVE` | How many results to persist (default: 5) |
| `VANITY_NUMBERS_TO_RETURN` | How many results to return to Connect (default: 3) |
| `VANITY_INDEX_PATH` | Path to the word index JSON (default: `/opt/vanity-index.json`) |

---

### `GetVanityNumbersFunction`

**Trigger:** HTTP GET `/callers`

Returns the most recent callers and their top vanity numbers from DynamoDB.

**Query parameters:**
| Parameter | Description |
|---|---|
| `limit` | Number of records to return (default: 5, max: 20) |

**Example:**
```
GET https://<api-id>.execute-api.us-west-2.amazonaws.com/prod/callers?limit=5
```

**Returns:**
```json
{
  "callers": [
    {
      "phoneNumber": "+18003569377",
      "topVanityNumbers": [...],
      "createdAt": "2026-09-09T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

## Infrastructure

| Resource | Description |
|---|---|
| `CallerRecordTable` | DynamoDB table — partition key `phoneNumber`, sort key `createdAt`. GSI `recordType-createdAt-index` for querying recent callers. |
| `VanityIndexLayer` | Lambda layer containing the pre-built word index at `/opt/vanity-index.json` |
| `VanityNumberApi` | HTTP API Gateway (v2) |
| `VanityNumberContactFlow` | Amazon Connect contact flow — auto-deployed and linked to the Lambda |

## Development

```bash
bun install
bun run build:layer   # build the vanity word index
bun run test          # run unit tests
bun run typecheck     # type check + lint
```

## Deployment

```bash
sam build
sam deploy
```

Configuration is in `samconfig.toml`. The `ConnectInstanceArn` parameter must point to an active Amazon Connect instance.
