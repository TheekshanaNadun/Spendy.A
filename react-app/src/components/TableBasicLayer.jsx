import React from 'react'

import TablesBorderColors from './child/TablesBorderColors'
import TablesBorderColorsTwo from './child/TablesBorderColorsTwo'
import TablesBorderColorsThree from './child/TablesBorderColorsThree'

const TableBasicLayer = () => {
    return (
        <div className="row gy-4">


            {/* TablesBorderColors */}
            <TablesBorderColors />

            {/* TablesBorderColorsTwo */}
            <TablesBorderColorsTwo />


            {/* TablesBorderColorsThree */}
            <TablesBorderColorsThree />

        </div>

    )
}

export default TableBasicLayer