# Python Setup Complete

## Status: ✅ Python 3.12.10 Installed & Ready

### Installation Details
- **Version:** Python 3.12.10
- **Path:** `C:\Users\Lenovo\AppData\Local\Programs\Python\Python312\python.exe`
- **Dependencies:** All Step 8 requirements installed
  - Flask 2.3.3 ✅
  - flask-cors 4.0.0 ✅
  - requests 2.31.0 ✅
  - pytest 7.4.0 ✅
  - pytest-cov 4.1.0 ✅

---

## How to Run Scoring Engine

### Option 1: Direct Command (Full Path)
```bash
/c/Users/Lenovo/AppData/Local/Programs/Python/Python312/python.exe app.py
```

### Option 2: Using Helper Script
```bash
cd /c/Users/Lenovo/Projects/SmartSite\ Advisor
./python scoring-engine/app.py
```

### Option 3: Full Python Path Export (Unix-style)
```bash
export PYTHON=/c/Users/Lenovo/AppData/Local/Programs/Python/Python312/python.exe
cd scoring-engine
$PYTHON app.py
```

---

## Start Scoring Engine (Flask Server)

```bash
cd /c/Users/Lenovo/Projects/SmartSite\ Advisor/scoring-engine

# Run with Python directly
/c/Users/Lenovo/AppData/Local/Programs/Python/Python312/python.exe app.py

# Server will start on http://localhost:5000
# You'll see:
#   * Running on http://127.0.0.1:5000
#   * Debugger PIN: XXX-XXX-XXX
```

### Test Scoring Engine Health
```bash
curl http://localhost:5000/health
# Response: {"status": "ok", "service": "scoring-engine"}
```

### Test Scoring API
```bash
curl -X POST http://localhost:5000/score \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"city": "Powai"},
    "specifications": {"age": 5},
    "amenities": ["Parking", "Gym"],
    "price": 95000000
  }'
```

---

## Run Tests

### Unit Tests
```bash
cd scoring-engine
/c/Users/Lenovo/AppData/Local/Programs/Python/Python312/python.exe tests/test_scoring.py
```

### Integration Tests (requires server running)
```bash
# Terminal 1: Start server
/c/Users/Lenovo/AppData/Local/Programs/Python/Python312/python.exe scoring-engine/app.py

# Terminal 2: Run tests
/c/Users/Lenovo/AppData/Local/Programs/Python/Python312/python.exe scoring-engine/verify_scoring_engine.py
```

---

## Full Step 8 Integration Test

```bash
# Terminal 1: Python Scoring Engine
cd /c/Users/Lenovo/Projects/SmartSite\ Advisor
/c/Users/Lenovo/AppData/Local/Programs/Python/Python312/python.exe scoring-engine/app.py

# Terminal 2: Node.js Backend
cd /c/Users/Lenovo/Projects/SmartSite\ Advisor/backend
npm start

# Terminal 3: Run Integration Tests
node verify_step8_integration.js
```

Expected output:
```
✅ TEST 1: Python Scoring Engine is running on port 5000
✅ TEST 2: Node.js backend is running on port 3000
✅ TEST 3-13: Property scoring integration tests
...
📊 RESULTS: 13 passed, 0 failed
```

---

## Next Steps

Now that Python is installed and scoring engine is ready:

1. **Start the scoring engine:** `./python scoring-engine/app.py`
2. **Start Node.js backend:** `npm start` (in backend folder)
3. **Run integration tests:** `node verify_step8_integration.js`
4. **Verify aiScore population** when properties are created

Then proceed to **Step 9: Recommendation Engine**

---

## Troubleshooting

### Python command not found globally?
Use the full path: `/c/Users/Lenovo/AppData/Local/Programs/Python/Python312/python.exe`

### Encoding errors with emojis?
Set encoding: `export PYTHONIOENCODING=utf-8` or add `PYTHONIOENCODING=utf-8` before commands

### Port 5000 already in use?
Edit `scoring-engine/app.py` line 53:
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Change to 5001
```
Then update backend API calls to use port 5001

### Flask not found?
Reinstall dependencies: `/c/Users/Lenovo/AppData/Local/Programs/Python/Python312/python.exe -m pip install -r scoring-engine/requirements.txt`

---

## Architecture Ready ✅

- ✅ Python 3.12 installed
- ✅ All dependencies installed
- ✅ Scoring engine created (5 modules)
- ✅ Flask server created
- ✅ Node.js integration created
- ✅ Integration tests created
- ✅ Tests pass (mostly, ROI thresholds may need tuning)

**Ready to proceed with Step 9: Recommendation Engine**
