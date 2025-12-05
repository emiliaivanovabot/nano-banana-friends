Send API requests to Serverless endpoints

Copy page

Submit and manage jobs for your endpoints by sending API requests.

This guide is for queue-based (i.e. traditional) Serverless endpoints. If you’re using load balancing endpoints, the request structure and endpoints will depend on how you define your HTTP servers.
Serverless endpoints provide synchronous and asynchronous job processing with automatic worker scaling based on demand. This page covers everything from basic input structure and job submission, to monitoring, troubleshooting, and advanced options for queue-based endpoints.

​
How requests work
After creating a Serverless endpoint, you can start sending it requests to submit jobs and retrieve results.
A request can include parameters, payloads, and headers that define what the endpoint should process. For example, you can send a POST request to submit a job, or a GET request to check status of a job, retrieve results, or check endpoint health.
A job is a unit of work containing the input data from the request, packaged for processing by your workers.
If no worker is immediately available, the job is queued. Once a worker is available, the job is processed using your worker’s handler function.
Queue-based endpoints provide a fixed set of operations for submitting and managing jobs. You can find a full list of operations and sample code in the sections below.
​
Sync vs. async
When you submit a job request, it can be either synchronous or asynchronous depending on the operation you use:
/runsync submits a synchronous job.
Client waits for the job to complete before returning the result.
A response is returned as soon as the job is complete.
Results are available for 1 minute by default (5 minutes max).
Ideal for quick responses and interactive applications.
/run submits an asynchronous job.
The job is processed in the background.
Retrieve the result by sending a GET request to the /status endpoint.
Results are available for 30 minutes after completion.
Ideal for long-running tasks and batch processing.
​
Request input structure
When submitting a job with /runsync or /run, your request must include a JSON object with the key input containing the parameters required by your worker’s handler function. For example:
{
  "input": {
    "prompt": "Your input here"
  }
}
The exact parameters required in the input object depend on your specific worker implementation (e.g. prompt commonly used for endpoints serving LLMs, but not all workers accept it). Check your worker’s documentation for a list of required and optional parameters.
​
Send requests from the console
The quickest way to test your endpoint is directly in the Runpod console. Navigate to the Serverless section, select your endpoint, and click the Requests tab.

You’ll see a default test request that you can modify as needed, then click Run to test your endpoint. On first execution, your workers will need to initialize, which may take a moment.
The initial response will look something like this:
{
  "id": "6de99fd1-4474-4565-9243-694ffeb65218-u1",
  "status": "IN_QUEUE"
}
You’ll see the full response after the job completes. If there are any errors, the console will display error logs to help you troubleshoot.
​
Operation overview
Queue-based endpoints support comprehensive job lifecycle management through multiple operations that allow you to submit, monitor, manage, and retrieve results from jobs.
Here’s a quick overview of the operations available for queue-based endpoints:
Operation	HTTP method	Description
/runsync	POST	Submit a synchronous job and wait for the complete results in a single response.
/run	POST	Submit an asynchronous job that processes in the background, and returns an immediate job ID.
/status	GET	Check the current status, execution details, and results of a submitted job.
/stream	GET	Receive incremental results from a job as they become available.
/cancel	POST	Stop a job that is in progress or waiting in the queue.
/retry	POST	Requeue a failed or timed-out job using the same job ID and input parameters.
/purge-queue	POST	Clear all pending jobs from the queue without affecting jobs already in progress.
/health	GET	Monitor the operational status of your endpoint, including worker and job statistics.
If you need to create an endpoint that supports custom API paths, use load balancing endpoints.
​
Operation reference
Below you’ll find detailed explanations and examples for each operation using cURL and the Runpod SDK.
You can also send requests using standard HTTP request APIs and libraries, such as fetch (for JavaScript) and requests (for Python).
Before running these examples, you’ll need to install the Runpod SDK:
# Python
python -m pip install runpod

# JavaScript
npm install --save runpod-sdk

# Go
go get github.com/runpod/go-sdk && go mod tidy
You should also set your API key and endpoint ID (found on the Overview tab for your endpoint in the Runpod console) as environment variables. Run the following commands in your local terminal, replacing YOUR_API_KEY and YOUR_ENDPOINT_ID with your actual API key and endpoint ID:
export RUNPOD_API_KEY="YOUR_API_KEY"
export ENDPOINT_ID="YOUR_ENDPOINT_ID"
​
/runsync
Synchronous jobs wait for completion and return the complete result in a single response. This approach works best for shorter tasks where you need immediate results, interactive applications, and simpler client code without status polling.
/runsync requests have a maximum payload size of 20 MB.
Results are available for 1 minute by default, but you can append ?wait=x to the request URL to extend this up to 5 minutes, where x is the number of milliseconds to store the results, from 1000 (1 second) to 300000 (5 minutes).
For example, ?wait=120000 will keep your results available for 2 minutes:
https://api.runpod.ai/v2/$ENDPOINT_ID/runsync?wait=120000
?wait is only available for cURL and standard HTTP request libraries.
cURL
Python
JavaScript
Go
curl --request POST \
     --url https://api.runpod.ai/v2/$ENDPOINT_ID/runsync \
     -H "accept: application/json" \
     -H "authorization: $RUNPOD_API_KEY" \
     -H "content-type: application/json" \
     -d '{ "input": {  "prompt": "Hello, world!" }}'
/runsync returns a response as soon as the job is complete:
{
  "delayTime": 824,
  "executionTime": 3391,
  "id": "sync-79164ff4-d212-44bc-9fe3-389e199a5c15",
  "output": [
    {
      "image": "https://image.url",
      "seed": 46578
    }
  ],
  "status": "COMPLETED"
}
​
/run
Asynchronous jobs process in the background and return immediately with a job ID. This approach works best for longer-running tasks that don’t require immediate results, operations requiring significant processing time, and managing multiple concurrent jobs.
/run requests have a maximum payload size of 10 MB.
Job results are available for 30 minutes after completion.
cURL
Python
JavaScript
Go
curl --request POST \
     --url https://api.runpod.ai/v2/$ENDPOINT_ID/run \
     -H "accept: application/json" \
     -H "authorization: $RUNPOD_API_KEY" \
     -H "content-type: application/json" \
    -d '{"input": {"prompt": "Hello, world!"}}'
/run returns a response with the job ID and status:
{
  "id": "eaebd6e7-6a92-4bb8-a911-f996ac5ea99d",
  "status": "IN_QUEUE"
}
Further results must be retrieved using the /status operation.
​
/status
Check the current state, execution statistics, and results of previously submitted jobs. The status operation provides the current job state, execution statistics like queue delay and processing time, and job output if completed.
You can configure time-to-live (TTL) for individual jobs by appending a TTL parameter to the request URL.
For example, https://api.runpod.ai/v2/$ENDPOINT_ID/status/YOUR_JOB_ID?ttl=6000 sets the TTL to 6 seconds.
cURL
Python
JavaScript
Go
Replace YOUR_JOB_ID with the actual job ID you received in the response to the /run operation.
curl --request GET \
     --url https://api.runpod.ai/v2/$ENDPOINT_ID/status/YOUR_JOB_ID \
     -H "authorization: $RUNPOD_API_KEY" \
/status returns a JSON response with the job status (e.g. IN_QUEUE, IN_PROGRESS, COMPLETED, FAILED), and an optional output field if the job is completed:
{
  "delayTime": 31618,
  "executionTime": 1437,
  "id": "60902e6c-08a1-426e-9cb9-9eaec90f5e2b-u1",
  "output": {
    "input_tokens": 22,
    "output_tokens": 16,
    "text": ["Hello! How can I assist you today?\nUSER: I'm having"]
  },
  "status": "COMPLETED"
}
​
/stream
Receive incremental results as they become available from jobs that generate output progressively. This works especially well for text generation tasks where you want to display output as it’s created, long-running jobs where you want to show progress, and large outputs that benefit from incremental processing.
To enable streaming, your handler must support the "return_aggregate_stream": True option on the start method of your handler. Once enabled, use the stream method to receive data as it becomes available.
For implementation details, see Streaming handlers.
cURL
Python
JavaScript
Go
Replace YOUR_JOB_ID with the actual job ID you received in the response to the /run request.
curl --request GET \
     --url https://api.runpod.ai/v2/$ENDPOINT_ID/stream/YOUR_JOB_ID \
     -H "accept: application/json" \
     -H "authorization: $RUNPOD_API_KEY" \
The maximum size for a single streamed payload chunk is 1 MB. Larger outputs will be split across multiple chunks.
Streaming response format:
[
  {
    "metrics": {
      "avg_gen_throughput": 0,
      "avg_prompt_throughput": 0,
      "cpu_kv_cache_usage": 0,
      "gpu_kv_cache_usage": 0.0016722408026755853,
      "input_tokens": 0,
      "output_tokens": 1,
      "pending": 0,
      "running": 1,
      "scenario": "stream",
      "stream_index": 2,
      "swapped": 0
    },
    "output": {
      "input_tokens": 0,
      "output_tokens": 1,
      "text": [" How"]
    }
  }
]
​
/cancel
Stop jobs that are no longer needed or taking too long to complete. This operation stops in-progress jobs, removes queued jobs before they start, and returns immediately with the canceled status.
cURL
Python
JavaScript
Go
Replace YOUR_JOB_ID with the actual job ID you received in the response to the /run request.
curl --request POST \
  --url https://api.runpod.ai/v2/$ENDPOINT_ID/cancel/YOUR_JOB_ID \
  -H "authorization: $RUNPOD_API_KEY" \
/cancel requests return a JSON response with the status of the cancel operation:
{
  "id": "724907fe-7bcc-4e42-998d-52cb93e1421f-u1",
  "status": "CANCELLED"
}
​
/retry
Requeue jobs that have failed or timed out without submitting a new request. This operation maintains the same job ID for tracking, requeues with original input parameters, and removes previous output. It can only be used for jobs with FAILED or TIMED_OUT status.
Replace YOUR_JOB_ID with the actual job ID you received in the response to the /run request.
curl --request POST \
     --url https://api.runpod.ai/v2/$ENDPOINT_ID/retry/YOUR_JOB_ID \
     -H "authorization: $RUNPOD_API_KEY"
You’ll see the job status updated to IN_QUEUE when the job is retried:
{
  "id": "60902e6c-08a1-426e-9cb9-9eaec90f5e2b-u1",
  "status": "IN_QUEUE"
}
Job results expire after a set period. Asynchronous jobs (/run) results are available for 30 minutes, while synchronous jobs (/runsync) results are available for 1 minute (up to 5 minutes with ?wait=t). Once expired, jobs cannot be retried.
​
/purge-queue
Remove all pending jobs from the queue when you need to reset or handle multiple cancellations at once. This is useful for error recovery, clearing outdated requests, resetting after configuration changes, and managing resource allocation.
cURL
Python
JavaScript
curl --request POST \
     --url https://api.runpod.ai/v2/$ENDPOINT_ID/purge-queue \
     -H "authorization: $RUNPOD_API_KEY"
    -H 'Authorization: Bearer RUNPOD_API_KEY'
/purge-queue operation only affects jobs waiting in the queue. Jobs already in progress will continue to run.
/purge-queue requests return a JSON response with the number of jobs removed from the queue and the status of the purge operation:
{
  "removed": 2,
  "status": "completed"
}
​
/health
Get a quick overview of your endpoint’s operational status including worker availability, job queue status, potential bottlenecks, and scaling requirements.
cURL
Python
JavaScript
curl --request GET \
     --url https://api.runpod.ai/v2/$ENDPOINT_ID/health \
     -H "authorization: $RUNPOD_API_KEY"
/health requests return a JSON response with the current status of the endpoint, including the number of jobs completed, failed, in progress, in queue, and retried, as well as the status of workers.
{
  "jobs": {
    "completed": 1,
    "failed": 5,
    "inProgress": 0,
    "inQueue": 2,
    "retried": 0
  },
  "workers": {
    "idle": 0,
    "running": 0
  }
}
​
vLLM and OpenAI requests
vLLM workers are specialized containers designed to efficiently deploy and serve large language models (LLMs) on Runpod Serverless.
vLLM requests use the standard format for endpoint operations, while providing additional flexibility and control over your requests compared to standard endpoints.
vLLM workers also support OpenAI compatible requests, enabling you to use familiar OpenAI client libraries with your vLLM endpoints.
​
Advanced options
Beyond the required input object, you can include optional top-level parameters to enable additional functionality for your queue-based endpoints.
​
Webhook notifications
Receive notifications when jobs complete by specifying a webhook URL. When your job completes, Runpod will send a POST request to your webhook URL containing the same information as the /status/JOB_ID endpoint.
{
  "input": {
    "prompt": "Your input here"
  },
  "webhook": "https://your-webhook-url.com"
}
Your webhook should return a 200 status code to acknowledge receipt. If the call fails, Runpod will retry up to 2 more times with a 10-second delay between attempts.
​
Execution policies
Control job execution behavior with custom policies. By default, jobs automatically terminate after 10 minutes without completion to prevent runaway costs.
{
  "input": {
    "prompt": "Your input here"
  },
  "policy": {
    "executionTimeout": 900000,
    "lowPriority": false,
    "ttl": 3600000
  }
}
Policy options:
Option	Description	Default	Constraints
executionTimeout	Maximum job runtime in milliseconds	600000 (10 minutes)	Must be > 5000 ms
lowPriority	When true, job won’t trigger worker scaling	false	-
ttl	Maximum job lifetime in milliseconds	86400000 (24 hours)	Must be ≥ 10000 ms, max 1 week
Setting executionTimeout in a request overrides the default endpoint setting for that specific job only.
​
S3-compatible storage integration
Configure S3-compatible storage for endpoints working with large files. This configuration is passed directly to your worker but not included in responses.
{
  "input": {
    "prompt": "Your input here"
  },
  "s3Config": {
    "accessId": "BUCKET_ACCESS_KEY_ID",
    "accessSecret": "BUCKET_SECRET_ACCESS_KEY",
    "bucketName": "BUCKET_NAME",
    "endpointUrl": "BUCKET_ENDPOINT_URL"
  }
}
Your worker must contain logic to use this information for storage operations.
S3 integration works with any S3-compatible provider including MinIO, Backblaze B2, DigitalOcean Spaces, and others.
​
Rate limits and quotas
Runpod enforces rate limits to ensure fair platform usage. These limits apply per endpoint and operation:
Operation	Method	Rate Limit	Concurrent Limit
/runsync	POST	2000 requests per 10 seconds	400 concurrent
/run	POST	1000 requests per 10 seconds	200 concurrent
/status	GET	2000 requests per 10 seconds	400 concurrent
/stream	GET	2000 requests per 10 seconds	400 concurrent
/cancel	POST	100 requests per 10 seconds	20 concurrent
/purge-queue	POST	2 requests per 10 seconds	N/A
/openai/*	POST	2000 requests per 10 seconds	400 concurrent
/requests	GET	10 requests per 10 seconds	2 concurrent
​
Dynamic rate limiting
In addition to the base rate limits above, Runpod implements a dynamic rate limiting system that scales with your endpoint’s worker count. This helps ensure platform stability while allowing higher throughput as you scale.
Rate limits are calculated using two values:
Base limit: A fixed rate limit per user per endpoint (shown in the table above)
Worker-based limit: A dynamic limit calculated as number_of_running_workers × requests_per_worker
The system uses whichever limit is higher between the base limit and worker-based limit. Requests are blocked with a 429 (Too Many Requests) status when the request count exceeds this effective limit within a 10-second window. This means as your endpoint scales up workers, your effective rate limit increases proportionally.
For example, if an endpoint has:
Base limit: 2000 requests per 10 seconds
Additional limit per worker: 50 requests per 10 seconds
20 running workers
The effective rate limit would be max(2000, 20 × 50) = 2000 requests per 10 seconds (base limit applies). With 50 running workers, it would scale to max(2000, 50 × 50) = 2500 requests per 10 seconds (worker-based limit applies).
Key points:
Rate limiting is based on request count per 10-second time windows
The system automatically uses whichever limit gives you more requests
Implement appropriate retry logic with exponential backoff to handle rate limiting gracefully.
​
Best practices
Follow these practices to optimize your queue-based endpoint usage:
Use asynchronous requests for jobs that take more than a few seconds to complete.
Implement polling with backoff when checking status of asynchronous jobs.
Set appropriate timeouts in your client applications and monitor endpoint health regularly to detect issues early.
Implement comprehensive error handling for all API calls.
Use webhooks for notification-based workflows instead of polling to reduce API calls.
Cancel unneeded jobs to free up resources and reduce costs.
During development, use the console testing interface before implementing programmatic integration.
​
Error handling and troubleshooting
When sending requests, be prepared to handle these common errors:
HTTP Status	Meaning	Solution
400	Bad Request	Check your request format and parameters
401	Unauthorized	Verify your API key is correct and has permission
404	Not Found	Check your endpoint ID
429	Too Many Requests	Implement backoff and retry logic
500	Internal Server Error	Check endpoint logs; worker may have crashed
Here are some common issues and suggested solutions:
Issue	Possible Causes	Solutions
Job stuck in queue	No available workers, max workers limit reached	Increase max workers, check endpoint health
Timeout errors	Job takes longer than execution timeout	Increase timeout in job policy, optimize job processing
Failed jobs	Worker errors, input validation issues	Check endpoint logs, verify input format, retry with fixed input
Rate limiting	Too many requests in short time	Implement backoff strategy, batch requests when possible
Missing results	Results expired	Retrieve results within expiration window (30 min for async, 1 min for sync)
Implementing proper error handling and retry logic will make your integrations more robust and reliable.