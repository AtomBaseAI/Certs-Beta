import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Date formatting utilities
 */

/**
 * Formats a date to DD/MM/YYYY format
 * @param date - Date object or string
 * @returns Formatted date string in DD/MM/YYYY format
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }
  
  const day = dateObj.getDate().toString().padStart(2, '0')
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const year = dateObj.getFullYear()
  
  return `${day}/${month}/${year}`
}

/**
 * Formats a date to DD/MM/YYYY format with time
 * @param date - Date object or string
 * @returns Formatted date string in DD/MM/YYYY HH:MM format
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }
  
  const day = dateObj.getDate().toString().padStart(2, '0')
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const year = dateObj.getFullYear()
  const hours = dateObj.getHours().toString().padStart(2, '0')
  const minutes = dateObj.getMinutes().toString().padStart(2, '0')
  
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

/**
 * Parses a DD/MM/YYYY string to a Date object
 * @param dateString - Date string in DD/MM/YYYY format
 * @returns Date object
 */
export const parseDate = (dateString: string): Date => {
  const parts = dateString.split('/')
  if (parts.length !== 3) {
    return new Date()
  }
  
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1 // Months are 0-indexed
  const year = parseInt(parts[2], 10)
  
  return new Date(year, month, day)
}

/**
 * Gets today's date in DD/MM/YYYY format
 * @returns Today's date in DD/MM/YYYY format
 */
export const getTodayDate = (): string => {
  return formatDate(new Date())
}
