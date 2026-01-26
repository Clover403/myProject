#!/bin/bash

echo "🧪 Testing Login Flow"
echo "===================="
echo ""

# Test 1: Login as Admin
echo "1️⃣ Testing Admin Login (achilles@cloverguard.com)"
echo "---------------------------------------------------"
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"achilles@cloverguard.com","password":"Clover*403"}')

echo "Response:"
echo $RESPONSE | jq '.'
echo ""

ROLE=$(echo $RESPONSE | jq -r '.user.role')
echo "✅ Role received: $ROLE"
echo ""

# Test 2: Login as Ethical Hacker
echo "2️⃣ Testing Ethical Hacker Login (trav@mail.com)"
echo "---------------------------------------------------"
RESPONSE2=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trav@mail.com","password":"Clover*403"}')

echo "Response:"
echo $RESPONSE2 | jq '.'
echo ""

ROLE2=$(echo $RESPONSE2 | jq -r '.user.role')
echo "✅ Role received: $ROLE2"
echo ""

echo "===================="
echo "🎯 Summary:"
echo "   Admin role: $ROLE"
echo "   Ethack role: $ROLE2"
