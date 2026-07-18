import { useState, useEffect } from "react";

const PROMOTION_KEY = "global_promotion_text";

export const usePromotion = () => {
  const [promotionText, setPromotionTextState] = useState<string>("");

  useEffect(() => {
    // Load initial promotion
    const loadPromo = () => {
      const stored = localStorage.getItem(PROMOTION_KEY);
      if (stored) setPromotionTextState(stored);
      else setPromotionTextState("");
    };

    loadPromo();

    // Listen for cross-tab or custom local changes
    const handleStorageChange = () => {
      loadPromo();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("promotion-updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("promotion-updated", handleStorageChange);
    };
  }, []);

  const setPromotionText = (text: string) => {
    localStorage.setItem(PROMOTION_KEY, text);
    setPromotionTextState(text);
    // Dispatch custom event so other components in the same window update instantly
    window.dispatchEvent(new Event("promotion-updated"));
  };

  return { promotionText, setPromotionText };
};
