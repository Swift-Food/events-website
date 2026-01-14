"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { categoriesApi } from '@/services/categories';
import { EventCategoryWithSubcategoriesResponseDto, EventSubcategoryResponseDto } from '@/types/category';

// Module-level refs to allow access from outside React components (e.g., auth context)
let categoriesClearFn: (() => void) | null = null;
let categoriesRefreshFn: (() => Promise<void>) | null = null;

// Export functions that can be called from anywhere (e.g., auth logout)
export function clearCategoriesCache() {
  categoriesClearFn?.();
}

export function refreshCategoriesCache() {
  return categoriesRefreshFn?.();
}

interface CategoriesContextType {
  categories: EventCategoryWithSubcategoriesResponseDto[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  clear: () => void;
  getSubcategoryById: (id: string) => EventSubcategoryResponseDto | undefined;
  getSubcategoryNames: (ids: string[]) => string[];
  getParentCategoryIds: (subcategoryIds: string[]) => string[];
  getSubcategoriesForCategory: (categoryName: string) => EventSubcategoryResponseDto[];
}

const CategoriesContext = createContext<CategoriesContextType | null>(null);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<EventCategoryWithSubcategoriesResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasFetched = useRef(false);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await categoriesApi.findAllWithSubcategories();
      setCategories(data);
      hasFetched.current = true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
      console.error('Failed to fetch categories:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    if (!hasFetched.current) {
      fetchCategories();
    }
  }, [fetchCategories]);

  const refresh = useCallback(async () => {
    hasFetched.current = false;
    await fetchCategories();
  }, [fetchCategories]);

  const clear = useCallback(() => {
    setCategories([]);
    hasFetched.current = false;
  }, []);

  // Register module-level functions for external access
  useEffect(() => {
    categoriesClearFn = clear;
    categoriesRefreshFn = refresh;
    return () => {
      categoriesClearFn = null;
      categoriesRefreshFn = null;
    };
  }, [clear, refresh]);

  // Helper to get a subcategory by ID
  const getSubcategoryById = useCallback((id: string): EventSubcategoryResponseDto | undefined => {
    for (const category of categories) {
      const subcategory = category.subcategories.find((sub) => sub.id === id);
      if (subcategory) {
        return {
          ...subcategory,
          categoryId: category.id,
          category: {
            id: category.id,
            name: category.name,
            description: category.description,
            image: category.image,
            iconName: category.iconName,
          },
        };
      }
    }
    return undefined;
  }, [categories]);

  // Helper to get subcategory names from IDs
  const getSubcategoryNames = useCallback((ids: string[]): string[] => {
    const names: string[] = [];
    for (const category of categories) {
      for (const subcategory of category.subcategories) {
        if (ids.includes(subcategory.id)) {
          names.push(subcategory.name);
        }
      }
    }
    return names;
  }, [categories]);

  // Helper to get parent category IDs from subcategory IDs
  const getParentCategoryIds = useCallback((subcategoryIds: string[]): string[] => {
    const parentCategoryIds = new Set<string>();
    for (const category of categories) {
      for (const subcategory of category.subcategories) {
        if (subcategoryIds.includes(subcategory.id)) {
          parentCategoryIds.add(category.id);
        }
      }
    }
    return Array.from(parentCategoryIds);
  }, [categories]);

  // Helper to get subcategories for a specific category name
  const getSubcategoriesForCategory = useCallback((categoryName: string): EventSubcategoryResponseDto[] => {
    const category = categories.find(
      (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!category) {
      return [];
    }

    return category.subcategories.map((sub) => ({
      ...sub,
      categoryId: category.id,
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        image: category.image,
        iconName: category.iconName,
      },
    }));
  }, [categories]);

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        isLoading,
        error,
        refresh,
        clear,
        getSubcategoryById,
        getSubcategoryNames,
        getParentCategoryIds,
        getSubcategoriesForCategory,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategoriesContext() {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategoriesContext must be used within a CategoriesProvider');
  }
  return context;
}
