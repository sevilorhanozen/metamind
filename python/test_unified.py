"""
Unified inference test scripti
"""
import json
import sys

# Test input
test_input = {
    "question": "Türkiye'nin başkenti neresidir?",
    "student_answer": "Ankara",
    "correct_answer": "Ankara"
}

print(json.dumps(test_input))

