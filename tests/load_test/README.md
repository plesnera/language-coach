
# WebSocket Load Testing for Remote Agent Engine

This directory provides a comprehensive load testing framework for your Agent Engine application using WebSocket connections, leveraging the power of [Locust](http://locust.io), a leading open-source load testing tool.

The load test simulates realistic user interactions by:
- Establishing WebSocket connections
- Sending audio chunks in the proper `realtimeInput` format
- Sending text messages to complete turns
- Collecting and measuring responses until `turn_complete`

## Load Testing with Remote Agent Engine

**1. Start the Expose App in Remote Mode:**

Launch the expose app server in a separate terminal, pointing to your deployed agent engine:

```bash
uv run python -m app.app_utils.expose_app --mode remote --remote-id <your-agent-engine-id>
```

Or if you have `deployment_metadata.json` in your project root:

```bash
uv run python -m app.app_utils.expose_app --mode remote
```

**2. Execute the Load Test:**

Using another terminal tab, trigger the Locust load test:

```bash
uv run --with locust==2.31.1 --with websockets locust -f tests/load_test/load_test.py \
-H http://127.0.0.1:8000 \
--headless \
-t 30s -u 1 -r 1 \
--csv=tests/load_test/.results/results \
--html=tests/load_test/.results/report.html
```

This command initiates a 30-second load test with 1 concurrent user.

**Results:**

Comprehensive CSV and HTML reports detailing the load test performance will be generated and saved in the `tests/load_test/.results` directory.

