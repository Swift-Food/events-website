"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { GuestTicketResponseDto, GuestTicketStatus } from "@/types/guest-ticket";

// Status labels for display
const STATUS_LABELS: Record<GuestTicketStatus, string> = {
  [GuestTicketStatus.PENDING_APPROVAL]: "Pending",
  [GuestTicketStatus.PENDING_PAYMENT]: "Awaiting Payment",
  [GuestTicketStatus.ACTIVE]: "Approved",
  [GuestTicketStatus.CHECKED_IN]: "Checked In",
  [GuestTicketStatus.CANCELLED]: "Cancelled",
  [GuestTicketStatus.REFUNDED]: "Refunded",
  [GuestTicketStatus.WAITLISTED]: "Waitlisted",
  [GuestTicketStatus.EXPIRED]: "Expired",
};

// Status colors
const STATUS_COLORS: Record<GuestTicketStatus, string> = {
  [GuestTicketStatus.PENDING_APPROVAL]: "#f59e0b",
  [GuestTicketStatus.PENDING_PAYMENT]: "#8b5cf6",
  [GuestTicketStatus.ACTIVE]: "#10b981",
  [GuestTicketStatus.CHECKED_IN]: "#3b82f6",
  [GuestTicketStatus.CANCELLED]: "#ef4444",
  [GuestTicketStatus.REFUNDED]: "#6b7280",
  [GuestTicketStatus.WAITLISTED]: "#f97316",
  [GuestTicketStatus.EXPIRED]: "#6b7280",
};

export interface GuestListPdfProps {
  guests: GuestTicketResponseDto[];
  eventName: string;
  filterStatus?: string;
}

// Extract guest name
function getGuestName(guest: GuestTicketResponseDto["guest"] | undefined): string {
  if (!guest) return "-";
  const firstName = guest.firstName || guest.user?.firstName || "";
  const lastName = guest.lastName || guest.user?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) return fullName;
  if (guest.user?.username) return guest.user.username;
  if (guest.user?.email) return guest.user.email.split("@")[0];
  return "-";
}

// Extract guest email
function getGuestEmail(guest: GuestTicketResponseDto["guest"] | undefined): string {
  return guest?.user?.email || "-";
}

// Format date
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingBottom: 20,
  },
  eventName: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    color: "#666666",
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 20,
  },
  statBox: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 4,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  statLabel: {
    fontSize: 9,
    color: "#666666",
    marginTop: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#000000",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 36,
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  colName: {
    width: "25%",
  },
  colEmail: {
    width: "28%",
  },
  colTicket: {
    width: "17%",
  },
  colStatus: {
    width: "15%",
  },
  colDate: {
    width: "15%",
  },
  cellText: {
    fontSize: 9,
    color: "#333333",
  },
  cellTextBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 3,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#999999",
  },
  pageNumber: {
    fontSize: 8,
    color: "#999999",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#666666",
  },
});

// Table Header Component
const TableHeader = () => (
  <View style={styles.tableHeader}>
    <View style={styles.colName}>
      <Text style={styles.tableHeaderText}>Name</Text>
    </View>
    <View style={styles.colEmail}>
      <Text style={styles.tableHeaderText}>Email</Text>
    </View>
    <View style={styles.colTicket}>
      <Text style={styles.tableHeaderText}>Ticket</Text>
    </View>
    <View style={styles.colStatus}>
      <Text style={styles.tableHeaderText}>Status</Text>
    </View>
    <View style={styles.colDate}>
      <Text style={styles.tableHeaderText}>Registered</Text>
    </View>
  </View>
);

// Table Row Component
const TableRow = ({ guest, index }: { guest: GuestTicketResponseDto; index: number }) => {
  const status = guest.status as GuestTicketStatus;
  const statusColor = STATUS_COLORS[status] || "#666666";
  const statusLabel = STATUS_LABELS[status] || guest.status;

  return (
    <View style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
      <View style={styles.colName}>
        <Text style={styles.cellTextBold}>{getGuestName(guest.guest)}</Text>
      </View>
      <View style={styles.colEmail}>
        <Text style={styles.cellText}>{getGuestEmail(guest.guest)}</Text>
      </View>
      <View style={styles.colTicket}>
        <Text style={styles.cellText}>{guest.ticketName || "-"}</Text>
      </View>
      <View style={styles.colStatus}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.colDate}>
        <Text style={styles.cellText}>{formatDate(guest.createdAt)}</Text>
      </View>
    </View>
  );
};

// Main PDF Document
export const GuestListPdf = ({ guests, eventName, filterStatus }: GuestListPdfProps) => {
  const exportDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const filterLabel = filterStatus && filterStatus !== "all"
    ? STATUS_LABELS[filterStatus as GuestTicketStatus] || filterStatus
    : "All Guests";

  // Calculate stats
  const totalGuests = guests.length;
  const checkedIn = guests.filter(g => g.status === GuestTicketStatus.CHECKED_IN).length;
  const approved = guests.filter(g => g.status === GuestTicketStatus.ACTIVE).length;

  // Split guests into pages (roughly 20 per page)
  const GUESTS_PER_PAGE = 20;
  const pages: GuestTicketResponseDto[][] = [];
  for (let i = 0; i < guests.length; i += GUESTS_PER_PAGE) {
    pages.push(guests.slice(i, i + GUESTS_PER_PAGE));
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  return (
    <Document>
      {pages.map((pageGuests, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {/* Header - only on first page */}
          {pageIndex === 0 && (
            <>
              <View style={styles.header}>
                <Text style={styles.eventName}>{eventName}</Text>
                <Text style={styles.subtitle}>
                  Guest List - {filterLabel} | Exported {exportDate}
                </Text>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{totalGuests}</Text>
                  <Text style={styles.statLabel}>Total Guests</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{approved}</Text>
                  <Text style={styles.statLabel}>Approved</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{checkedIn}</Text>
                  <Text style={styles.statLabel}>Checked In</Text>
                </View>
              </View>
            </>
          )}

          {/* Table */}
          <View style={styles.table}>
            <TableHeader />
            {pageGuests.length > 0 ? (
              pageGuests.map((guest, index) => (
                <TableRow
                  key={guest.id}
                  guest={guest}
                  index={pageIndex === 0 ? index : index}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No guests to display</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>{eventName}</Text>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
            />
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default GuestListPdf;
