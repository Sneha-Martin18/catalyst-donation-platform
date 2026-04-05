import React from 'react';
import './Pagination.css';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    className={`pagination-button ${currentPage === i ? 'active' : ''}`}
                    onClick={() => onPageChange(i)}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

    return (
        <div className="pagination-container">
            <button
                className="pagination-button"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                title="First Page"
            >
                <ChevronsLeft className="pagination-icon" />
            </button>
            <button
                className="pagination-button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                title="Previous Page"
            >
                <ChevronLeft className="pagination-icon" />
            </button>

            {renderPageNumbers()}

            <button
                className="pagination-button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                title="Next Page"
            >
                <ChevronRight className="pagination-icon" />
            </button>
            <button
                className="pagination-button"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                title="Last Page"
            >
                <ChevronsRight className="pagination-icon" />
            </button>
        </div>
    );
};

export default Pagination;
