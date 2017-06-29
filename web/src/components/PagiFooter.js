// @flow
import React from 'react';
import ChevronLeft from 'material-ui/svg-icons/navigation/chevron-left';
import ChevronRight from 'material-ui/svg-icons/navigation/chevron-right';
import IconButton from 'material-ui/IconButton';

const styles = {
    footerContent: {
        float: 'right'
    },
    footerText: {
        float: 'right',
        paddingTop: '16px',
        height: '16px'
    }
}
type PagiFooterProps = {
    offset: number,
    total: number, // total number of rows
    limit: number, // num of rows in each page
    onPageClick: (offset: number)=>void // what to do after clicking page number
}

export default (props: PagiFooterProps) => {
    let { offset, total, limit, onPageClick } = props;
    return <div style={styles.footerContent}>
    <IconButton disabled={offset === 0} onClick={() => onPageClick(offset - limit)}>
        <ChevronLeft/>
    </IconButton>
    <IconButton disabled={offset + limit >= total} onClick={onPageClick(offset + limit)}>
        <ChevronRight/>
    </IconButton>
    {Math.min((offset + 1), total) + '-' + Math.min((offset + limit), total) + ' of ' + total}
</div>}