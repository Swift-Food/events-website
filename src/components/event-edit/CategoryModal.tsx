"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

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

  // Track trigger position for portal positioning
  useEffect(() => {
    if (!isOpen) {
      setTriggerRect(null);
      return;
    }
    const trigger = document.querySelector('[data-category-trigger]');
    if (!trigger) return;
    const updateRect = () => setTriggerRect(trigger.getBoundingClientRect());
    updateRect();
    const main = document.querySelector('main');
    main?.addEventListener('scroll', updateRect);
    window.addEventListener('resize', updateRect);
    return () => {
      main?.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
    };
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
      // Collapse when unchecking
      setExpandedCategories(prev => {
        const next = new Set(prev);
        next.delete(categoryId);
        return next;
      });
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
      // Expand when checking (if has subcategories)
      const category = categories.find(c => c.id === categoryId);
      if (category?.subcategories && category.subcategories.length > 0 && setSelectedSubcategoryIds) {
        setExpandedCategories(prev => new Set(prev).add(categoryId));
      }
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

  if (!isOpen || !triggerRect) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className="absolute rounded-xl bg-[#1a1a1a]/70 backdrop-blur-sm border border-white/10 shadow-2xl shadow-black/50 overflow-hidden pointer-events-auto"
        style={{
          top: triggerRect.bottom + 8,
          left: triggerRect.left,
          width: triggerRect.width,
        }}
      >
        <div className="p-3 space-y-2 max-h-[60vh] overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full rounded-lg bg-white/10 pl-9 pr-3 py-2 text-sm text-white outline-none placeholder:text-white/40 border border-white/10 focus:border-accent transition-all"
            />
          </div>

          {/* Selected count and clear */}
          {totalSelected > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-white/60">
                {totalSelected} selected
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-white/60 hover:text-white transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Category List */}
          <div className="overflow-y-auto flex-1 -mx-1 px-1">
            <div className="space-y-1">
              {filteredCategories.length === 0 ? (
                <p className="text-sm text-white/60 text-center py-4">
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
                          className={`flex-1 flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-all ${
                            isSelected
                              ? "bg-accent/20 border border-accent/30"
                              : "hover:bg-white/5 border border-transparent"
                          }`}
                        >
                          <div
                            className={`h-4 w-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                              isSelected
                                ? "bg-accent-dark border-accent-dark"
                                : "border-white/20 bg-transparent"
                            }`}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <div className="flex-1">
                            <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-white/80"}`}>
                              {getCategoryLabel(category.name)}
                            </span>
                            {category.description && (
                              <p className="text-xs text-white/50 line-clamp-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                          {selectedSubcategoriesInCategory > 0 && (
                            <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
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
                              <ChevronUp className="h-4 w-4 text-white/60" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-white/60" />
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
                                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all hover:bg-white/5"
                              >
                                <div
                                  className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${
                                    isSubSelected
                                      ? "bg-accent-dark border-accent-dark"
                                      : "border-white/20 bg-transparent"
                                  }`}
                                >
                                  {isSubSelected && <Check className="h-2.5 w-2.5 text-white" />}
                                </div>
                                <span className="text-sm text-white/60">
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
              className="w-full rounded-lg bg-accent-dark py-2 text-sm font-semibold text-white transition-all hover:bg-accent"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
