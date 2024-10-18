

import {
  DataTable,
  DataTableSkeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@carbon/react';
import * as styles from "./ExtractedEntities.module.scss";
import * as widgetStyles from "@client/widget.module.scss";
import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import {v4 as uuid} from 'uuid';
import {SocketPayload, useSocketEvent} from "@client/providers/Socket";
import * as _ from "lodash";

type RowType = {
  id: string;
  name: string | undefined;
  values: Set<string | undefined>;
}

const ExtractedEntities = () => {
  const [rows, setRows] = useState<RowType[]>([]);
  const {t} = useTranslation();

  const headers = [
    {
      key: 'name',
      header: t("entityName"),
    },
    {
      key: 'values',
      header: t("entityValues"),
    },
  ];

  const {lastMessage} = useSocketEvent('celeryMessage')

  useEffect(() => {
    if (lastMessage) {
      const payload: SocketPayload = JSON.parse(lastMessage?.payloadString);

      if (payload?.type === "extraction") {
        if (payload?.parameters?.value !== "[None]") {
          const newRow: RowType = {
            id: uuid(),
            name: payload?.parameters?.title,
            values: new Set([payload?.parameters?.value])
          };

          setRows((prev) => {
            const i = _.findIndex(prev, ["name", newRow.name]);

            /*
            if (i > -1) {
              prev[i]?.values?.add(newRow?.values?.values().next().value)
            } else {
              prev = [...prev, newRow];
            }
            */
            if (i == -1) {
              prev = [...prev, newRow];
            }

            return prev;
          });
        }
      }
    }
  }, [lastMessage])

  const buildRow = (row: any, getRowProps: Function) => {
    const values = [...row.cells.find((el: any) => el.info.header === "values")?.value];
    return <TableRow {...getRowProps({row})} key={row.id}>
      {row.cells.map((cell: any) => (
        <TableCell key={cell.id} className={styles.tableCell}>
          {cell.info.header === "values" ? values.map((val: string) => <>{val}<br/></>) : cell.value}
        </TableCell>
      ))}
    </TableRow>
  };

  return (
    <div className={widgetStyles.dashboardWidget}>
      <div className={widgetStyles.widgetTitle}>
        {t("extractedEntities")}
      </div>
      {rows?.length ? <DataTable rows={rows} headers={headers} size="sm" isSortable>
          {({rows, headers, getTableProps, getHeaderProps, getRowProps, getExpandedRowProps}) => (
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((header, id) => (
                    <TableHeader {...getHeaderProps({header})} key={id}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => buildRow(row, getRowProps))}
              </TableBody>
            </Table>
          )}
        </DataTable> :
        <DataTableSkeleton columnCount={headers.length}
                           rowCount={3}
                           headers={headers}
                           showToolbar={false}
                           showHeader={false}
                           compact={true}>
        </DataTableSkeleton>
      }
    </div>
  );
};

export default ExtractedEntities;