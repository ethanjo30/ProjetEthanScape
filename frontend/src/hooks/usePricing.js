
/*Action: file_editor create /app/frontend/src/hooks/usePricing.js --file-text "import { useState, useEffect, useCallback } from \"react\";
import axios from \"axios\";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const usePricing = () => {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await axios.get(`${API}/pricing`);
        setPricing(response.data);
      } catch (error) {
        console.error(\"Error fetching pricing:\", error);
        // Fallback pricing
        setPricing({
          \"4-9\": { \"30\": 22, \"60\": 25, \"90\": 28 },
          \"10-19\": { \"30\": 19, \"60\": 22, \"90\": 25 },
          \"20-29\": { \"30\": 16, \"60\": 19, \"90\": 22 },
          \"30-39\": { \"30\": 13, \"60\": 16, \"90\": 19 }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPricing();
  }, []);

  const calculatePrice = useCallback((numPeople, duration) => {
    if (!pricing || numPeople < 4 || numPeople > 39) {
      return { pricePerPerson: 0, totalPrice: 0, category: \"\" };
    }

    let category;
    let categoryLabel;
    
    if (numPeople >= 4 && numPeople <= 9) {
      category = \"4-9\";
      categoryLabel = \"4-9 personnes\";
    } else if (numPeople >= 10 && numPeople <= 19) {
      category = \"10-19\";
      categoryLabel = \"10-19 personnes\";
    } else if (numPeople >= 20 && numPeople <= 29) {
      category = \"20-29\";
      categoryLabel = \"20-29 personnes\";
    } else {
      category = \"30-39\";
      categoryLabel = \"30-39 personnes\";
    }

    const pricePerPerson = pricing[category][String(duration)] || 0;
    const totalPrice = pricePerPerson * numPeople;

    return { pricePerPerson, totalPrice, category: categoryLabel };
  }, [pricing]);

  return { pricing, loading, calculatePrice };
};

export default usePricing;
"
Observation: Create successful: /app/frontend/src/hooks/usePricing.js*/