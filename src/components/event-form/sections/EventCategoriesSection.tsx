"use client";

import { useState, useEffect } from "react";
import { Tags, ChevronDown, X } from "lucide-react";
import CategoryModal from "@/components/event-edit/CategoryModal";
import { useEventCreation } from "@/context/EventCreationContext";
import { useCategoriesContext } from "@/lib/categories-context";
import { categoriesApi } from "@/services/categories";
import { EventCategoryResponseDto } from "@/types/category";
import { toast } from "sonner";

export default function EventCategoriesSection() {
  const {
    selectedCategoryIds,
    setSelectedCategoryIds,
    selectedSubcategoryIds,
    setSelectedSubcategoryIds,
  } = useEventCreation();

  const { categories: categoriesWithSubs } = useCategoriesContext();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<
    EventCategoryResponseDto[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const categories = await categoriesApi.findAll();
        setAvailableCategories(categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative">
        <button
          type="button"
          data-category-trigger
          onClick={() => setIsCategoryModalOpen(!isCategoryModalOpen)}
          className="flex w-full items-center gap-3 rounded-xl bg-card-background hover:bg-card-background/85 backdrop-blur-xl px-4 py-3 text-foreground transition-all cursor-pointer"
        >
          <Tags className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 text-left">
            {loadingCategories ? (
              <>
                <p className="text-sm font-medium text-foreground">
                  Event Categories
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-primary"></div>
                  <span className="text-xs text-muted-foreground">
                    Loading...
                  </span>
                </div>
              </>
            ) : selectedCategoryIds.length > 0 ||
              selectedSubcategoryIds.length > 0 ? (
              <>
                <p className="text-sm font-medium text-foreground">
                  {selectedCategoryIds.length}{" "}
                  {selectedCategoryIds.length === 1 ? "Category" : "Categories"}
                  {selectedSubcategoryIds.length > 0 &&
                    `, ${selectedSubcategoryIds.length} ${selectedSubcategoryIds.length === 1 ? "Subcategory" : "Subcategories"}`}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {categoriesWithSubs
                    .filter((cat) => selectedCategoryIds.includes(cat.id))
                    .map((cat) => {
                      const categoryName =
                        cat.name.charAt(0).toUpperCase() +
                        cat.name.slice(1).toLowerCase();
                      const selectedSubs = (cat.subcategories || [])
                        .filter((sub) =>
                          selectedSubcategoryIds.includes(sub.id),
                        )
                        .map(
                          (sub) =>
                            sub.name.charAt(0).toUpperCase() +
                            sub.name.slice(1).toLowerCase(),
                        );
                      if (selectedSubs.length > 0) {
                        return `${categoryName} (${selectedSubs.join(", ")})`;
                      }
                      return categoryName;
                    })
                    .join(", ")}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-foreground">
                Event Categories
              </p>
            )}
          </div>
          {selectedCategoryIds.length > 0 ||
          selectedSubcategoryIds.length > 0 ? (
            <div
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCategoryIds([]);
                setSelectedSubcategoryIds([]);
              }}
              className="p-1 rounded-full hover:bg-white/10 transition-all"
            >
              <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </div>
          ) : (
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform ${isCategoryModalOpen ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {/* Category Dropdown */}
        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          availableCategories={availableCategories}
          selectedCategoryIds={selectedCategoryIds}
          setSelectedCategoryIds={setSelectedCategoryIds}
          selectedSubcategoryIds={selectedSubcategoryIds}
          setSelectedSubcategoryIds={setSelectedSubcategoryIds}
        />
      </div>
    </div>
  );
}
