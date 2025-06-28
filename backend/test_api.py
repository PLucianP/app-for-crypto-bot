"""
Test script to verify backend API endpoints
Run this after starting the backend server
"""

import httpx
import asyncio
from datetime import datetime

BASE_URL = "http://localhost:8000"

async def test_health():
    """Test health endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        print(f"Health Check: {response.status_code}")
        print(f"Response: {response.json()}")
        print("-" * 50)

async def test_api_keys():
    """Test API keys listing"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/settings/api-keys")
        print(f"API Keys List: {response.status_code}")
        print(f"Response: {response.json()}")
        print("-" * 50)

async def test_trading_config():
    """Test trading configuration"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/settings/trading-config")
        print(f"Trading Config: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")
        print("-" * 50)

async def test_latest_decision():
    """Test latest decision endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/analysis/latest-decision")
        print(f"Latest Decision: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        else:
            print("No decisions found")
        print("-" * 50)

async def test_dashboard_summary():
    """Test dashboard summary"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/dashboard/summary")
        print(f"Dashboard Summary: {response.status_code}")
        print(f"Response: {response.json()}")
        print("-" * 50)

async def main():
    """Run all tests"""
    print("=" * 50)
    print("Testing Crypto Trading Bot Backend API")
    print(f"Time: {datetime.now()}")
    print("=" * 50)
    
    try:
        await test_health()
        await test_api_keys()
        await test_trading_config()
        await test_latest_decision()
        await test_dashboard_summary()
        
        print("\nAll tests completed!")
        print("\nNext steps:")
        print("1. Configure API keys via PUT /api/settings/api-keys/{key_type}")
        print("2. Set up trading configuration via PUT /api/settings/trading-config")
        print("3. Trigger analysis via POST /api/trading/execute-analysis")
        
    except Exception as e:
        print(f"Error during testing: {e}")
        print("\nMake sure the backend server is running on port 8000")

if __name__ == "__main__":
    asyncio.run(main()) 