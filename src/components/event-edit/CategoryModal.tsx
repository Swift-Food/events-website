"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { useCategoriesContext } from "@/lib/categories-context";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCategories?: any[]; // Legacy prop, now using context
  selectedCategoryIds: string[];
  setSelectedCategoryIds: (ids: string[]) => void;
  selectedSubcategoryIds?: string[];
  setSelectedSubcategoryIds?: (ids: string[]) => void;
}

export default function CategoryModal({
  isOpen,
  onClose,
  selectedCategoryIds,
  setSelectedCategoryIds,
  selectedSubcategoryIds = [],
  setSelectedSubcategoryIds,
}: CategoryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Get categories from context
  const { categories } = useCategoriesContext();

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Clear search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        // Check if click is on the parent button (which has its own toggle logic)
        if (target.closest('[data-category-trigger]')) {
          return;
        }
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getCategoryLabel = (categoryName: string) => {
    return categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();
  };

  const filteredCategories = categories.filter((category) => {
    const categoryMatches = getCategoryLabel(category.name).toLowerCase().includes(searchQuery.toLowerCase());
    const subcategoryMatches = category.subcategories?.some(sub =>
      getCategoryLabel(sub.name).toLowerCase().includes(searchQuery.toLowerCase())
    );
    return categoryMatches || subcategoryMatches;
  });

  const toggleCategory = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== categoryId));
      // Also remove any subcategories of this category if setSelectedSubcategoryIds is provided
      if (setSelectedSubcategoryIds) {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          const subcategoryIdsToRemove = category.subcategories?.map(s => s.id) || [];
          setSelectedSubcategoryIds(selectedSubcategoryIds.filter(id => !subcategoryIdsToRemove.includes(id)));
        }
      }
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
    }
  };

  const toggleSubcategory = (subcategoryId: string, categoryId: string) => {
    if (!setSelectedSubcategoryIds) return;

    if (selectedSubcategoryIds.includes(subcategoryId)) {
      setSelectedSubcategoryIds(selectedSubcategoryIds.filter((id) => id !== subcategoryId));
    } else {
      // Add subcategory
      setSelectedSubcategoryIds([...selectedSubcategoryIds, subcategoryId]);
      // Also ensure parent category is selected
      if (!selectedCategoryIds.includes(categoryId)) {
        setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
      }
    }
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const clearAll = () => {
    setSelectedCategoryIds([]);
    if (setSelectedSubcategoryIds) {
      setSelectedSubcategoryIds([]);
    }
  };

  const totalSelected = selectedCategoryIds.length + selectedSubcategoryIds.length;

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl bg-card-background/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
    >
      <div className="p-4 space-y-3 max-h-[60vh] overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-lg bg-card-secondary-background pl-10 pr-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 border border-white/10 focus:border-primary/50 transition-all"
          />
        </div>

        {/* Selected count and clear */}
        {totalSelected > 0 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">
              {totalSelected} selected
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Category List */}
        <div className="overflow-y-auto flex-1 -mx-1 px-1">
          <div className="space-y-1">
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No categories found
              </p>
            ) : (
              filteredCategories.map((category) => {
                const isSelected = selectedCategoryIds.includes(category.id);
                const hasSubcategories = category.subcategories && category.subcategories.length > 0;
                const isExpanded = expandedCategories.has(category.id);
                const selectedSubcategoriesInCategory = hasSubcategories
                  ? category.subcategories.filter(sub => selectedSubcategoryIds.includes(sub.id)).length
                  : 0;

                return (
                  <div key={category.id}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                          isSelected
                            ? "bg-primary/20 border border-primary/30"
                            : "hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <div
                          className={`h-5 w-5 rounded flex items-center justify-center border transition-all ${
                            isSelected
                              ? "bg-primary border-primary"
                              : "border-white/20 bg-transparent"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
                            {getCategoryLabel(category.name)}
                          </span>
                          {category.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                        {selectedSubcategoriesInCategory > 0 && (
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                            +{selectedSubcategoriesInCategory}
                          </span>
                        )}
                      </button>
                      {hasSubcategories && setSelectedSubcategoryIds && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(category.id)}
                          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Subcategories */}
                    {hasSubcategories && setSelectedSubcategoryIds && isExpanded && (
                      <div className="ml-8 mt-1 space-y-1 pb-2">
                        {category.subcategories.map((subcategory) => {
                          const isSubSelected = selectedSubcategoryIds.includes(subcategory.id);
                          return (
                            <button
                              key={subcategory.id}
                              type="button"
                              onClick={() => toggleSubcategory(subcategory.id, category.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                                isSubSelected
                                  ? "bg-purple-500/20 border border-purple-500/30"
                                  : "hover:bg-white/5 border border-transparent"
                              }`}
                            >
                              <div
                                className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${
                                  isSubSelected
                                    ? "bg-purple-500 border-purple-500"
                                    : "border-white/20 bg-transparent"
                                }`}
                              >
                                {isSubSelected && <Check className="h-2.5 w-2.5 text-white" />}
                              </div>
                              <span className={`text-sm ${isSubSelected ? "text-purple-400" : "text-muted-foreground"}`}>
                                {getCategoryLabel(subcategory.name)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Done Button */}
        <div className="pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
