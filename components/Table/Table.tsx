/* eslint-disable react/display-name */
/* eslint-disable react/jsx-key */
import React, { useEffect } from 'react';
// import { data } from '../../mockData';
import { useTable, usePagination, useFlexLayout, useBlockLayout, Row } from 'react-table';
import { useFilters, useGlobalFilter, useAsyncDebounce } from 'react-table'
import { useSticky } from 'react-table-sticky';
import styles from './Table.module.scss';
import ReactTooltip from 'react-tooltip';
import { useMediaQuery } from 'react-responsive'
import firebase from "firebase";
import dynamic from 'next/dynamic'
import Skeleton, { SkeletonTheme }  from 'react-loading-skeleton';
import { matchSorter } from 'match-sorter'
import {Dropdown, Modal, Button} from 'react-bootstrap';
import moment from 'moment';

const ReactPaginate = dynamic(() => import('react-paginate'))

// Define a default UI for filtering
function GlobalFilter({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}) {
  const count = preGlobalFilteredRows.length
  const [value, setValue] = React.useState(globalFilter)
  const onChange = value => {
    setGlobalFilter(value || undefined)
  }

  return (
    <span>
      Search:{' '}
      <input
        value={value || ""}
        className={styles.searchInput}
        onChange={e => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={`${count} records...`}
        style={{
          fontSize: '1.1rem',
          border: '0',
        }}
      />
    </span>
  )
}

// Define a default UI for filtering
function DefaultColumnFilter({
  column: { filterValue, preFilteredRows, setFilter },
}) {
  const count = preFilteredRows.length

  return (
    <input
      value={filterValue || ''}
      onChange={e => {
        setFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
      }}
      placeholder={`Search ${count} records...`}
    />
  )
}

// This is a custom filter UI for selecting
// a unique option from a list
function SelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id },
}) {
  // Calculate the options for filtering
  // using the preFilteredRows
  const options = React.useMemo(() => {
    const options = new Set()
    preFilteredRows.forEach(row => {
      options.add(row.original[id])
    })
    return [...options.values()]
  }, [id, preFilteredRows])

  // Render a multi-select box
  return (
    <Dropdown>
      <Dropdown.Toggle className={styles.filterSelect}>
        {filterValue || 'All'}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item value="" onClick={() => setFilter('')}>
          All
        </Dropdown.Item>
        {options.map((option, i) => (
          <Dropdown.Item key={i} value={option} onClick={() => setFilter(option)}>
            {option}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
    // <select
    //   className={styles.filterSelect}
    //   value={filterValue}
    //   onChange={e => {
    //     setFilter(e.target.value || undefined)
    //   }}
    // >
    //   <option value="">All</option>
    //   {options.map((option, i) => (
    //     <option key={i} value={option}>
    //       {option}
    //     </option>
    //   ))}
    // </select>
  )
}

// This is a custom filter UI that uses a
// slider to set the filter value between a column's
// min and max values
function SliderColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id },
}) {
  // Calculate the min and max
  // using the preFilteredRows

  const [min, max] = React.useMemo(() => {
    let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    preFilteredRows.forEach(row => {
      min = Math.min(row.values[id], min)
      max = Math.max(row.values[id], max)
    })
    return [min, max]
  }, [id, preFilteredRows])

  return (
    <>
      <input
        type="range"
        min={min}
        max={max}
        value={filterValue || min}
        onChange={e => {
          setFilter(parseInt(e.target.value, 10))
        }}
      />
      <button onClick={() => setFilter(undefined)}>Off</button>
    </>
  )
}

// This is a custom UI for our 'between' or number range
// filter. It uses two number boxes and filters rows to
// ones that have values between the two
function NumberRangeColumnFilter({
  column: { filterValue = [], preFilteredRows, setFilter, id },
}) {
  const [min, max] = React.useMemo(() => {
    let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    preFilteredRows.forEach(row => {
      min = Math.min(row.values[id], min)
      max = Math.max(row.values[id], max)
    })
    return [min, max]
  }, [id, preFilteredRows])

  return (
    <div
      style={{
        display: 'flex',
      }}
    >
      <input
        value={filterValue[0] || ''}
        type="number"
        onChange={e => {
          const val = e.target.value
          setFilter((old = []) => [val ? parseInt(val, 10) : undefined, old[1]])
        }}
        placeholder={`Min (${min})`}
        style={{
          width: '70px',
          marginRight: '0.5rem',
        }}
      />
      to
      <input
        value={filterValue[1] || ''}
        type="number"
        onChange={e => {
          const val = e.target.value
          setFilter((old = []) => [old[0], val ? parseInt(val, 10) : undefined])
        }}
        placeholder={`Max (${max})`}
        style={{
          width: '70px',
          marginLeft: '0.5rem',
        }}
      />
    </div>
  )
}

function fuzzyTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, { keys: [row => row.values[id]] })
}

// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = val => !val

const Table = () => {
  const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      fuzzyText: fuzzyTextFilterFn,
      // Or, override the default text filter to use
      // "startWith"
      text: (rows, id, filterValue) => {
        return rows.filter(row => {
          const rowValue = row.values[id]
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true
        })
      },
    }),
    []
  )

  const defaultColumn = React.useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter,
    }),
    []
  )

  const isDesktopOrLaptop = useMediaQuery({
    query: '(min-device-width: 768px)'
  })
  const [data, setData] = React.useState([]);
  const [equipments, setEquipments] = React.useState([]);
  const [isTableLoaded, setIsTableLoaded] = React.useState(false);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [selectedRow, setSelectedRow] = React.useState({});
  const [selectedStatus, setSelectedStatus] = React.useState();

  React.useEffect(() => {
    ReactTooltip.rebuild();
    const dbRef = firebase.database().ref();
    dbRef.child("users").limitToLast(1000).get().then((snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val());
        setIsTableLoaded(true)
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
    dbRef.child("equipments").limitToLast(1000).get().then((snapshot) => {
      if (snapshot.exists()) {
        setEquipments(snapshot.val());
        setIsTableLoaded(true)
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  }, [])

  React.useEffect(() => {
    if(isTableLoaded) {
      const dbRef = firebase.database().ref();
      dbRef.child("users").limitToLast(1000).get().then((snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val());
          setIsTableLoaded(true)
        } else {
          console.log("No data available");
        }
      }).catch((error) => {
        console.error(error);
      });
    }
  }, [isTableLoaded])

  const tableData = React.useMemo(() => {
    const users = Object.entries(data).map((user, index) => ({...user[1], userId: Object.keys(data)[index]})).filter((user: any) => user.equipments).filter((user: any) => user.equipments.every(eq => eq.id));
    const flatten = (arr) => arr.reduce((acc, item) => [...acc, ...item], []);
    if (equipments && Object.entries(equipments).map((user) => user[1]).length > 0) {
      const withEquipUsersDepp = users.map((user, index) => {
        return user.equipments.map((equip) => ({
          ...user,
          equipName: Object.entries(equipments).map((user) => user[1]).filter(eq => eq.id === equip.id)[0]['name'],
          equipStatus: equip.status,
          equipId: equip.id,
          equipCreatedAt: equip.createdAt,
          equipExpiredAt: equip.expiredAt,
          equipDuration: Object.entries(equipments).map((user) => user[1]).filter(eq => eq.id === equip.id)[0]['duration'],
          equipCount: Object.entries(equipments).map((user) => user[1]).filter(eq => eq.id === equip.id)[0]['number'],
          equipPrice: Object.entries(equipments).map((user) => user[1]).filter(eq => eq.id === equip.id)[0]['price'],
          equipWeight: Object.entries(equipments).map((user) => user[1]).filter(eq => eq.id === equip.id)[0]['weight']
        }));
      });
      return flatten(withEquipUsersDepp);
    } else {
      return []
    }
  }, [data, equipments]);

  const columns = React.useMemo(
    () => [
      {
        Header: 'Full Name',
        accessor: 'fullName',
        sticky: 'left',
        Cell: ({row} : any) => (<p>{row.original.fullName}</p>),
        Filter: <></>,
      },
      {
        Header: 'Email',
        accessor: 'email',
        Cell: ({row} : any) => (<p>{row.original.email}</p>),
        Filter: <></>,
      },
      {
        Header: 'Role',
        accessor: 'role',
        Cell: ({row} : any) => (<p>{row.original.role}</p>),
        Filter: <></>,
      },
      {
        Header: 'Equip Name',
        accessor: 'equipName',
        Cell: ({row} : any) => (<p>{row.original.equipName}</p>),
        Filter: <></>,
      },
      {
        Header: 'Equip Price',
        accessor: 'equipPrice',
        Cell: ({row} : any) => (<p>{row.original.equipPrice}</p>),
        Filter: <></>,
      },
      {
        Header: 'Equip Weight',
        accessor: 'equipWeight',
        Cell: ({row} : any) => (<p>{row.original.equipWeight}</p>),
        Filter: <></>,
      },
      {
        Header: 'Equip Id',
        accessor: 'equipId',
        Cell: ({row} : any) => (<p>{row.original.equipId}</p>),
        Filter: <></>,
      },
      {
        Header: 'Equip Status',
        accessor: 'equipStatus',
        Cell: ({row} : any) => (<p>{row.original.equipStatus}</p>),
        Filter: SelectColumnFilter,
        filter: 'includes',
      },
    ],
    []
  );

  const onPageChange = (pageNumber: number) => {
    gotoPage(pageNumber)
    // if (pageNumber === pageCount - 1) {
    //   const dbRef = firebase.database().ref();
    //   dbRef.child("sites")
    //     .limitToLast(100)
    //     .get()
    //     .then((snapshot) => {
    //     if (snapshot.exists()) {
    //       setData({...data, ...snapshot.val()});
    //       gotoPage(pageNumber)
    //     } else {
    //       console.log("No data available");
    //     }
    //   }).catch((error) => {
    //     console.error(error);
    //   });
    // } else {
    //   gotoPage(pageNumber);
    // }
  }

  const tableInstance = useTable({ columns, data: tableData, defaultColumn, filterTypes }, useSticky, useFilters, useGlobalFilter, usePagination);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    pageCount,
    gotoPage,
    state: { pageIndex, globalFilter },
    visibleColumns,
    preGlobalFilteredRows,
    setGlobalFilter,
  } = tableInstance

  const onModalClose = () => {
    setIsModalVisible(false);
    setSelectedRow({});
    setSelectedStatus('')
  }

  const onStatusUpdate = () => {
    const updatedEquip = selectedRow.equipments.map(equip => {
      if (equip.id === selectedRow.equipId) {
        return ({...equip, status: selectedStatus})
      }
      return equip;
    });
    firebase.database().ref('users/' + selectedRow.userId).update({
      equipments: updatedEquip
    })
    const dbRef = firebase.database().ref();
    dbRef.child("users").limitToLast(1000).get().then((snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val());
          setIsTableLoaded(true)
        } else {
          console.log("No data available");
        }
      }).catch((error) => {
        console.error(error);
      });
    onModalClose();
  }

  console.log('selected row', selectedRow)

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableWrapper}>
        <table cellSpacing="0" className={styles.table} style={{marginBottom: !(tableData.length > 0) ? '650px' : '0'}} {...getTableProps()}>
          <thead>
            <tr>
                <th
                  colSpan={visibleColumns.length}
                  style={{
                    textAlign: 'left',
                  }}
                >
                  <GlobalFilter
                    preGlobalFilteredRows={preGlobalFilteredRows}
                    globalFilter={globalFilter}
                    setGlobalFilter={setGlobalFilter}
                  />
              </th>
            </tr>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()}>
                    {column.render('Header')}
                    <div>{column.canFilter ? column.render('Filter') : null}</div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {!(tableData?.length > 0) && (
            <div className={styles.tableLoader}>
              <SkeletonTheme color="#13242d" highlightColor="#376882">
                <Skeleton count={10} width={'100%'} />
              </SkeletonTheme>
            </div>
          )}
          <tbody {...getTableBodyProps()}>
            {page.map((row: Row<object>, index: number) => {
              if (index === 0 && pageIndex === 0 ) {
                prepareRow(row)
                return (
                  <tr {...row.getRowProps()} onClick={() => {setSelectedRow(row.original); setIsModalVisible(true)}}>
                    {row.cells.map((cell: { getCellProps: () => JSX.IntrinsicAttributes & React.ClassAttributes<HTMLTableDataCellElement> & React.TdHTMLAttributes<HTMLTableDataCellElement>; render: (arg0: string) => {} | null | undefined; }, index: number) => {
                      return (
                        <td {...cell.getCellProps()}>
                          {cell.render('Cell')}
                        </td>
                      )
                    })}
                  </tr>
                )
              }
              if (index === 1  && pageIndex === 0 ) {
                prepareRow(row)
                return (
                  <tr {...row.getRowProps()} onClick={() => {setSelectedRow(row.original); setIsModalVisible(true)}}>
                    {row.cells.map((cell: { getCellProps: () => JSX.IntrinsicAttributes & React.ClassAttributes<HTMLTableDataCellElement> & React.TdHTMLAttributes<HTMLTableDataCellElement>; render: (arg0: string) => {} | null | undefined; }, index: number) => {
                      return (
                        <td {...cell.getCellProps()}>
                          {cell.render('Cell')}
                        </td>
                      )
                    })}
                  </tr>
                )
              }
              if (index === 2  && pageIndex === 0 ) {
                prepareRow(row)
                return (
                  <tr {...row.getRowProps()} onClick={() => {setSelectedRow(row.original); setIsModalVisible(true)}}>
                    {row.cells.map((cell: { getCellProps: () => JSX.IntrinsicAttributes & React.ClassAttributes<HTMLTableDataCellElement> & React.TdHTMLAttributes<HTMLTableDataCellElement>; render: (arg0: string) => {} | null | undefined; }, index: number) => {
                      return (
                        <td {...cell.getCellProps()}>
                          {cell.render('Cell')}
                        </td>
                      )
                    })}
                  </tr>
                )
              }
              prepareRow(row)
              return (
                <tr {...row.getRowProps()} onClick={() => {setSelectedRow(row.original); setIsModalVisible(true)}}>
                  {row.cells.map((cell: { getCellProps: () => JSX.IntrinsicAttributes & React.ClassAttributes<HTMLTableDataCellElement> & React.TdHTMLAttributes<HTMLTableDataCellElement>; render: (arg0: string) => boolean | React.ReactFragment | React.ReactChild | React.ReactPortal | null | undefined; }) => {
                    return (
                      <td {...cell.getCellProps()}>
                        {cell.render('Cell')}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div>
      {tableData.length  > 0 && (
        <ReactPaginate
            previousLabel={'<'}
            nextLabel={'>'}
            breakLabel={'...'}
            breakClassName={'break-me'}
            pageCount={pageCount}
            marginPagesDisplayed={1}
            pageRangeDisplayed={isDesktopOrLaptop ? 6 : 2}
            onPageChange={(prop) => {
              onPageChange(prop.selected);
            }}
            containerClassName={'pagination'}
            activeClassName={'active'}
          />
      )}
      </div>
      <Modal show={isModalVisible} onHide={onModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedRow.fullName} - {selectedRow.equipName}</Modal.Title>
        </Modal.Header>

        <Modal.Body >
          <div style={{display: 'flex', justifyContent: 'space-between', paddingRight: '25%'}}>
            <div>
              <p>Price: ${selectedRow.equipPrice}</p>
              <p>Weight: {selectedRow.equipWeight}</p>
              <p>From: {moment(selectedRow.equipCreatedAt).format('DD/MM/YYYY')}</p>
            </div>
            <div>
              <p>Equipment Id: {selectedRow.equipId}</p>
              <p>Count: {selectedRow.equipCount}</p>
              {selectedRow.equipExpiredAt && (<p>To: {moment(selectedRow.equipExpiredAt).format('DD/MM/YYYY')}</p>)}
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <span style={{marginRight: '10px'}}>Current status: </span>
            <Dropdown>
              <Dropdown.Toggle style={{backgroundColor: '#04D0D0', outline: 'none', border: 'none'}}>
                {selectedStatus || selectedRow.equipStatus}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item value="pending" onClick={() => setSelectedStatus('pending')}>pending</Dropdown.Item>
                <Dropdown.Item value="pending" onClick={() => setSelectedStatus('successful')}>successful</Dropdown.Item>
                <Dropdown.Item value="pending" onClick={() => setSelectedStatus('rejected')}>rejected</Dropdown.Item>

              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onModalClose} style={{outline: 'none', border: 'none'}}>Close</Button>
          <Button variant="primary" onClick={onStatusUpdate} style={{backgroundColor: '#04D0D0', outline: 'none', border: 'none'}}>Save changes</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default dynamic(() => Promise.resolve(Table), {
  ssr: false
})
