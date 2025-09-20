DROP TABLE IF EXISTS building_data;

-- Create table with JSONB column
CREATE TABLE building_data (
    id SERIAL PRIMARY KEY,

    data JSONB NOT NULL
);

INSERT INTO building_data(data)
VALUES (
'{
  "ENGINEERING BUILDINGS": {
    "BioScience Research Collaborative": "7:00 AM - 6:00 PM Weekdays",
    "Brockman Hall of Physics": "N/A",
    "Dell Butcher Hall": "N/A",
    "Anne and Charles Duncan Hall": "N/A",
    "George R. Brown Hall": "N/A",
    "Howard Keck Hall": "N/A",
    "Mechanical Engineering Building": "Varies, contact building",
    "Mechanical Laboratory": "Varies, contact building",
    "Oshman Engineering Design Kitchen": "Varies, contact building, requires access",
    "Ryon Engineering Laboratory": "Varies, contact building",
    "Space Science and Technology Building": "Varies, contact building, contact building"
  },
  "RESIDENTIAL COLLEGES": {
    "Baker College": "N/A, Students only",
    "Will Rice College": "N/A, Students only",
    "Hanszen College": "N/A, Students only",
    "Wiess College": "N/A, Students only",
    "Jones College": "N/A, Students only",
    "Brown College": "N/A, Students only",
    "Lovett College": "N/A, Students only",
    "Sid Richardson College": "N/A, Students only",
    "Martel College": "N/A, Students only",
    "McMurtry College": "N/A, Students only",
    "Duncan College": "N/A, Students only"
  },
  "MISC. BUILDINGS": {
    "Fondren Library": {
      "RICE ID HOLDERS": [
        ["Monday - Thursday", "7:00 AM - 2:00 AM"],
        ["Friday", "7:00 AM - 12:00 AM"],
        ["Saturday", "9:00 AM - 12:00 AM"],
        ["Sunday", "10:00 AM - 2:00 PM"]
      ],
      "NON-RICE ID HOLDERS": [
        ["Monday - Friday", "7:00 AM - 10:00 PM"],
        ["Saturday - Sunday", "10:00 AM - 6:00 PM"]
      ]
    },
    "Recreation Center": {
      "Building": [
        ["Monday - Thursday", "6:00 AM - 12:00 AM"],
        ["Friday", "6:00 AM - 10:00 PM"],
        ["Saturday", "8:00 AM - 10:00 PM"],
        ["Sunday", "10:00 AM - 10:00 PM"]
      ],
      "Competition Pool": [
        ["Monday - Thursday", "6:00 AM - 10:00 PM"],
        ["Friday", "6:00 AM - 9:00 PM"],
        ["Saturday", "8:00 AM - 8:00 PM"],
        ["Sunday", "10:00 AM - 8:00 PM"]
      ],
      "Recreation Pool": [
        ["Monday - Friday", "2:00 PM - 8:00 PM"],
        ["Saturday - Sunday", "10:00 AM - 8:00 PM"]
      ]
    }
  }
}'::jsonb
);

