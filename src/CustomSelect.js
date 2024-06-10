import React, { useState } from 'react';
import './CustomSelect.css';
import { ReactComponent as EthIcon } from './icons/eth.svg';
import { ReactComponent as UsdtIcon } from './icons/usdt.svg';
import { ReactComponent as UsdcIcon } from './icons/usdc.svg';
import { ReactComponent as DownIcon } from './icons/chevron-down-solid.svg';

const options = [
    { value: '1', label: 'ETH', icon: <EthIcon className='currency-icon' /> },
    { value: '2', label: 'USDT', icon: <UsdtIcon className='currency-icon' /> },
    { value: '3', label: 'USDC', icon: <UsdcIcon className='currency-icon' /> },
];

const CustomSelect = ({ onChange }) => {
    // Initialize selectedOption with the first option in the array
    const [selectedOption, setSelectedOption] = useState(options.find(option => option.label === 'ETH')); // Change based on initial state requirement
    const [isOpen, setIsOpen] = useState(false);

    const handleOptionClick = (option) => {
        setSelectedOption(option);
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div className="custom-select-container">
            <div
                className={`custom-select ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOption.icon}
                {selectedOption.label}
                <span className={`arrow ${isOpen ? 'open' : ''}`}>
                    <DownIcon className="down-icon" />
                </span>
            </div>
            {isOpen && (
                <div className="custom-select-options">
                    {options
                        .filter(option => option.value !== selectedOption.value)
                        .map((option) => (
                            <div
                                key={option.value}
                                className="custom-select-option"
                                onClick={() => handleOptionClick(option)}
                            >
                                {option.icon}
                                {option.label}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
