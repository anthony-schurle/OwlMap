-- 1. Drop table if it exists (optional)
DROP TABLE IF EXISTS dining_halls;

-- 2. Create table with a JSONB column
CREATE TABLE dining_halls (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL
);

-- 3. Insert the entire JSON as a single row
INSERT INTO dining_halls (data) VALUES (
'{
    "BAKER": {
        "MONDAY-FRIDAY": [
            ["Breakfast", "7:30 AM - 10:30 AM"],
            ["Lunch", "11:30 AM - 2:00 PM"],
            ["Dinner", "5:00 PM - 8:00 PM"]
        ],
        "MONDAY - THURSDAY": [
            ["Late Night Dining", "9:00 PM - 11:00 PM"]
        ],
        "SATURDAY - SUNDAY": [
            ["All Dining", "CLOSED"]
        ]
    },
    "NORTH": {
        "MONDAY-FRIDAY": [
            ["Breakfast", "7:30 AM - 10:30 AM"],
            ["Snack Period", "10:00 AM - 11:00 AM"],
            ["Lunch", "11:30 AM - 2:00 PM"]
        ], 
        "MONDAY - THURSDAY": [
            ["Dinner", "5:00 PM - 8:00 PM"]
        ],
        "FRIDAY": [
            ["Dinner", "CLOSED"]
        ],
        "SATURDAY": [
            ["All Dining", "CLOSED"]
        ],
        "SUNDAY": [
            ["Breakfast", "8:00 AM - 11:00 AM"],
            ["Lunch", "11:30 AM - 2:00 PM"],
            ["Munch", "3:00 PM - 5:00 PM"],
            ["Dinner", "5:30 PM - 8:30 PM"]
        ] 
    },
    "SIEBEL": {
        "MONDAY - FRIDAY": [
            ["Enhanced Breakfast", "7:30 AM - 10:00 AM"],
            ["Snack Period", "10:00 AM - 11:00 PM"],
            ["Lunch", "11:30 AM - 2:00 PM"]
        ],
        "MONDAY - THURSDAY": [
            ["Dinner", "5:00 PM - 8:00 PM"]
        ],
        "FRIDAY": [
            ["Dinner", "CLOSED"]
        ],
        "SATURDAY": [
            ["All Dining", "CLOSED"]
        ],
        "SUNDAY": [
            ["Breakfast", "8:00 AM - 11:00 AM"],
            ["Lunch", "11:30 AM - 2:00 PM"],
            ["Munch", "3:00 PM - 5:00 PM"],
            ["Dinner", "5:30 PM - 8:30 PM"]
        ]  
    },
    "WEST": {
        "MONDAY - FRIDAY": [
            ["Breakfast", "7:30 AM - 10:00 AM"],
            ["Lunch", "11:30 AM - 1:30 PM"],
            ["Munch", "2:00 PM - 4:00 PM"],
            ["Snack Period", "4:00 PM - 5:00 PM"],
            ["Extended Dinner", "5:30 PM - 9:00 PM"]
        ],
        "SATURDAY": [
            ["Breakfast", "8:00 AM - 11:00 AM"],
            ["Lunch", "11:30 AM - 2:00 PM"],
            ["Munch", "3:00 PM - 5:00 PM"],
            ["Dinner", "5:30 PM - 8:30 PM"]
        ],
        "SUNDAY": [
            ["All Dining", "CLOSED"]
        ]
    },
    "SOUTH": {
        "MONDAY - FRIDAY": [
            ["Enhanced Breakfast", "7:30 AM - 10:00 AM"],
            ["Lunch", "11:30 AM - 1:30 PM"],
            ["Munch", "2:00 PM - 4:00 PM"],
            ["Snack Period", "4:00 PM - 5:00 PM"],
            ["Extended Dinner", "5:30 PM - 9:00 PM"]
        ],
        "SATURDAY": [
            ["Breakfast", "8:00 AM - 11:00 AM"],
            ["Lunch", "11:30 AM - 2:00 PM"],
            ["Munch", "3:00 PM - 5:00 PM"],
            ["Dinner", "5:30 PM - 8:30 PM"]
        ],
        "SUNDAY": [
            ["All Dining", "CLOSED"]
        ]
    }
}');

