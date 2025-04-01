"use client";

import { Badge } from "@components/badge";
import { Dropdown } from "@components/dropdown";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  formatLargeNumber,
  formatNumber,
  truncateAddress,
} from "@utils/formatting";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { css } from "styled-system/css";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import * as styles from "../styles";

interface Props<T> {
  pageSize?: number;
  showPagination?: boolean;
}

export interface Data {
  id: string;
  totalStaked: bigint | string;
  totalPoints: bigint | string | null;
}

const isUserWallet = (walletAddress: string, address: string) =>
  walletAddress.toLowerCase() === address?.toLowerCase();

const dropdownItems = [
  { value: "asc", label: "Points - high to low" },
  { value: "desc", label: "Points - low to high" },
];

const fetchLeaderboard = async () => {
  const response = await fetch('/api/leaderboards');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const LeaderboardsTable = <T extends Data>(props: Props<T>) => {
  const { address } = useAccount();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: props.pageSize ?? 10,
  });

  const {
    data = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["leaderboards"],
    queryFn: fetchLeaderboard,
    refetchInterval: 60000,
  });

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        id: "place",
        header: "Place",
        cell: ({ row }) => {
          const userWallet = isUserWallet(row.original.id, address as string);
          return (
            <div className={clsx({ [styles.userWalletText]: userWallet })}>
              {row.index + 1}
            </div>
          );
        },
      },
      {
        id: "walletAddress",
        accessorKey: "id",
        header: "Wallet",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          const userWallet = isUserWallet(value, address as string);
          return (
            <div
              className={clsx({ [styles.userWalletText]: userWallet })}
              style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}
            >
              {truncateAddress(value)}
              {userWallet && (
                <Badge
                  title="You"
                  variant="table"
                  className={css({ hideBelow: "md" })}
                />
              )}
            </div>
          );
        },
      },
      {
        id: "totalStaked",
        accessorKey: "totalStaked",
        header: "KLIMA Staked",
        cell: ({ row, getValue }) => {
          const value = getValue();
          const userWallet = isUserWallet(row.original.id, address as string);
          return (
            <div className={clsx({ [styles.userWalletText]: userWallet })}>
              {formatNumber(formatUnits(value as bigint, 9), 2)}
            </div>
          );
        },
      },
      {
        id: "totalPoints",
        header: "Points",
        accessorKey: "totalPoints",
        cell: ({ row, getValue }) => {
          const value = getValue() as string;
          const userWallet = isUserWallet(row.original.id, address as string);
          if (value === null) {
            return;
          }
          return (
            <div className={clsx({ [styles.userWalletText]: userWallet })}>
              {formatLargeNumber(Number(value))}
            </div>
          );
        },
      },
    ],
    [data]
  );

  const table = useReactTable({
    columns,
    data: data || [],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      pagination,
      sorting,
    },
  });

  const handleSortOrderChange = (value: string) =>
    setSorting([{ id: "totalPoints", desc: value !== "desc" }]);

  if (error) {
    return (
      <div className={styles.tableCell}>Error loading leaderboard data</div>
    );
  }

  return (
    <>
      <div
        className={clsx(
          styles.flexRow,
          css({
            flexDirection: "column !important",
            lg: { flexDirection: "row !important" },
          })
        )}
      >
        <div className={styles.title}>Leaderboard</div>
        {props.showPagination && (
          <div
            className={clsx(
              styles.flexRow,
              css({
                flexDirection: "column !important",
                lg: { flexDirection: "row !important" },
              })
            )}
          >
            <label className={styles.sortByLabel}>Sort by</label>
            <Dropdown
              items={dropdownItems}
              defaultSelected={dropdownItems[0]}
              onSelect={(value) => handleSortOrderChange(value)}
            />
          </div>
        )}
      </div>

      <div
        className={clsx(
          styles.flexRow,
          css({
            hideFrom: "md",
            width: "100%",
            flexDirection: "column !important",
            lg: { flexDirection: "row !important" },
          })
        )}
      >
        {table.getRowModel().rows.length ? (
          <>
            {table.getRowModel().rows.map((row) => {
              const firstCell = row.getAllCells()[0];
              const walletAddress = row
                .getAllCells()[1]
                .getContext()
                .getValue();
              return (
                <div
                  key={row.id}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0rem",
                    padding: "1.2rem 0",
                    borderBottom: "1px solid #999999",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      marginBottom: "1.2rem",
                      color: "#1E1e1e",
                      fontWeight: "700",
                      fontSize: "1.8rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.8rem",
                    }}
                  >
                    <div
                      className={css({
                        textAlign: "center",
                        width: "3.3rem",
                      })}
                    >
                      {flexRender(
                        firstCell?.column?.columnDef?.cell,
                        firstCell?.getContext()
                      )}
                    </div>
                    {isUserWallet(
                      walletAddress as string,
                      address as string
                    ) && <Badge variant="table" title="You" />}
                  </div>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <div
                      className={css({
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0rem",
                      })}
                      key={headerGroup.id}
                    >
                      {headerGroup.headers.map((header) => {
                        if (header.id === "place") return null;
                        return (
                          <div
                            className={css({
                              fontWeight: 400,
                              fontSize: "1.2rem",
                              lineHeight: "1.6rem",
                              color: "#777",
                              display: "flex",
                              flex: 1,
                              alignItems: "center",
                              justifyContent: "center",
                              "&:first-child": {
                                justifyContent: "flex-start",
                              },
                              "&:last-child": {
                                justifyContent: "flex-end",
                              },
                            })}
                            key={header.id}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.8rem",
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      if (cell.column.id === "place") return null;
                      return (
                        <div
                          className={css({
                            fontWeight: 400,
                            fontSize: "1.4rem",
                            lineHeight: "2rem",
                            color: "#1E1e1e",
                            display: "flex",
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            "&:first-child": {
                              justifyContent: "flex-start",
                            },
                            "&:last-child": {
                              justifyContent: "flex-end",
                            },
                          })}
                          key={cell.id}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {props.showPagination && (
              <div className={styles.paginationButtons}>
                <button
                  className={styles.paginationButton}
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </button>
                <button
                  className={styles.paginationButton}
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {isLoading ? (
              <p>Loading Leaderboards...</p>
            ) : (
              <div className={styles.tableCell}>
                <i>No data to display yet</i>
              </div>
            )}
          </>
        )}
      </div>

      <div
        className={clsx(
          styles.tableContainer,
          css({ hideBelow: "md", width: "100%" })
        )}
      >
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    aria-label="leaderboard-table-head"
                    className={styles.tableHead}
                    colSpan={header.colSpan}
                  >
                    <div>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className={styles.tableBody}>
            {table.getRowModel().rows.length ? (
              <>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <td
                          key={cell.id}
                          aria-label="leaderboard-table-cell"
                          className={styles.tableCell}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ) : (
              <>
                {isLoading ? (
                  <tr>
                    <td className={styles.tableCell} colSpan={4}>
                      Loading Leaderboards...
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td className={styles.tableCell} colSpan={4}>
                      <i>No data to display yet</i>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>

        {props.showPagination && table.getRowModel().rows.length ? (
          <div className={styles.pagination}>
            <div>
              <div className={styles.paginationText}>
                Showing{" "}
                {table.getState().pagination.pageIndex * pagination.pageSize +
                  1}{" "}
                to{" "}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                  pagination.pageSize,
                  table.getRowCount()
                )}{" "}
                of {table.getRowCount().toLocaleString()} results
              </div>
            </div>
            <div className={styles.paginationButtons}>
              <button
                className={styles.paginationButton}
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <MdKeyboardArrowLeft fontSize="2rem" />
              </button>
              {Array.from(
                {
                  length: Math.ceil(table.getRowCount() / pagination.pageSize),
                },
                (_, index) => index + 1
              )
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => table.setPageIndex(page - 1)}
                    className={clsx(styles.paginationButton, {
                      [styles.active]:
                        page === table.getState().pagination.pageIndex + 1,
                    })}
                  >
                    {page}
                  </button>
                ))
                .reduce((acc, curr, index, array) => {
                  if (
                    index > 0 &&
                    index < array.length - 1 &&
                    curr.props.children - array[index - 1].props.children > 1
                  ) {
                    acc.push(<span key={`ellipsis-${index}`}>...</span>);
                  }
                  acc.push(curr);
                  return acc;
                }, [] as React.ReactNode[])}
              <button
                className={styles.paginationButton}
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <MdKeyboardArrowRight fontSize="2rem" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};
