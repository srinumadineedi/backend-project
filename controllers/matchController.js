export const getMatches = async (req, res) => {
    try {
        const result = await pool.query(`
            WITH PrimaryMatches AS (
                SELECT 
                    p1.pet_id AS pet_id, 
                    p1.name AS pet_name, 
                    p1.breed AS pet_breed, 
                    p1.gender AS pet_gender,
                    p2.pet_id AS match_id,
                    p2.name AS match_name,
                    p2.breed AS match_breed,
                    p2.gender AS match_gender,
                    p2.age AS match_age,
                    p2.food AS match_food,
                    p2.health_status AS match_health_status,
                    p2.profile_pic AS match_profile_pic
                FROM "Pet" p1
                LEFT JOIN "Pet" p2 
                ON LOWER(p1.breed) = LOWER(p2.breed)  
                AND p1.gender != p2.gender
                AND p1.pet_id != p2.pet_id
            ),
            FallbackMatches AS (
                SELECT 
                    p1.pet_id AS pet_id, 
                    p1.name AS pet_name, 
                    p1.breed AS pet_breed, 
                    p1.gender AS pet_gender,
                    p2.pet_id AS match_id,
                    p2.name AS match_name,
                    p2.breed AS match_breed,
                    p2.gender AS match_gender,
                    p2.age AS match_age,
                    p2.food AS match_food,
                    p2.health_status AS match_health_status,
                    p2.profile_pic AS match_profile_pic
                FROM "Pet" p1
                LEFT JOIN "Pet" p2 
                ON p1.gender != p2.gender
                AND p1.pet_id != p2.pet_id
                WHERE NOT EXISTS (
                    SELECT 1 FROM PrimaryMatches pm WHERE pm.pet_id = p1.pet_id
                )
            )
            SELECT 
                p1.pet_id,
                p1.pet_name AS pet,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'pet_id', p1.match_id,
                            'name', p1.match_name,
                            'breed', p1.match_breed,
                            'age', p1.match_age,
                            'gender', p1.match_gender,
                            'food', p1.match_food,
                            'health_status', p1.match_health_status,
                            'profile_pic', p1.match_profile_pic
                        )
                    ) FILTER (WHERE p1.match_id IS NOT NULL), '[]'::json
                ) AS matches
            FROM (
                SELECT * FROM PrimaryMatches
                UNION ALL
                SELECT * FROM FallbackMatches
            ) p1
            GROUP BY p1.pet_id, p1.pet_name;
        `);

        console.log("✅ Matchmaking Query Result:", result.rows);

        res.json(result.rows);
    } catch (error) {
        console.error("❌ Matchmaking Query Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
