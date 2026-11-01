/**
 * Keyset / Cursor-Based Pagination Service
 * High-performance cursor pagination eliminating slow SQL OFFSET scans across millions of rows.
 */

export interface CursorPayload {
  timestamp: string;
  id: string;
  checksum: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  totalReturned: number;
}

export class PaginationService {
  private readonly secret: string;

  constructor(secret: string = 'sf_cursor_integrity_salt') {
    this.secret = secret;
  }

  /**
   * Simple hash for cursor integrity check
   */
  private generateChecksum(timestamp: string, id: string): string {
    let hash = 0;
    const str = `${timestamp}:${id}:${this.secret}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Encodes a timestamp and item ID into an opaque Base64 URL-safe cursor
   */
  public encodeCursor(timestamp: string, id: string): string {
    const checksum = this.generateChecksum(timestamp, id);
    const payload: CursorPayload = { timestamp, id, checksum };
    const jsonStr = JSON.stringify(payload);
    return Buffer.from(jsonStr, 'utf-8').toString('base64url');
  }

  /**
   * Decodes and verifies cursor integrity
   */
  public decodeCursor(cursor: string): { timestamp: string; id: string } | null {
    try {
      const jsonStr = Buffer.from(cursor, 'base64url').toString('utf-8');
      const payload: CursorPayload = JSON.parse(jsonStr);

      if (!payload.timestamp || !payload.id || !payload.checksum) {
        return null;
      }

      // Verify integrity
      const expectedChecksum = this.generateChecksum(payload.timestamp, payload.id);
      if (payload.checksum !== expectedChecksum) {
        return null;
      }

      return { timestamp: payload.timestamp, id: payload.id };
    } catch {
      return null;
    }
  }

  /**
   * Perform in-memory or query keyset pagination across ordered records
   * Assumes items are ordered by `createdAt DESC, id DESC`
   */
  public paginate<T extends { id: string; createdAt: string }>(
    allItems: T[],
    cursor: string | null,
    limit: number = 50
  ): PaginatedResult<T> {
    let startIndex = 0;

    if (cursor) {
      const decoded = this.decodeCursor(cursor);
      if (decoded) {
        // Find index of item right after the cursor
        const cursorIndex = allItems.findIndex(
          (item) => item.createdAt <= decoded.timestamp && item.id < decoded.id
        );
        if (cursorIndex !== -1) {
          startIndex = cursorIndex;
        } else {
          // Alternative timestamp-only fallback if exact id not found
          const fallbackIndex = allItems.findIndex((item) => item.createdAt < decoded.timestamp);
          startIndex = fallbackIndex !== -1 ? fallbackIndex : allItems.length;
        }
      }
    }

    const pageItems = allItems.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < allItems.length;

    let nextCursor: string | null = null;
    if (hasMore && pageItems.length > 0) {
      const lastItem = pageItems[pageItems.length - 1];
      nextCursor = this.encodeCursor(lastItem.createdAt, lastItem.id);
    }

    let prevCursor: string | null = null;
    if (startIndex > 0 && pageItems.length > 0) {
      const firstItem = pageItems[0];
      prevCursor = this.encodeCursor(firstItem.createdAt, firstItem.id);
    }

    return {
      items: pageItems,
      nextCursor,
      prevCursor,
      hasMore,
      totalReturned: pageItems.length,
    };
  }
}
