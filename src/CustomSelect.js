import React, { useState } from 'react';
import './CustomSelect.css';
import { ReactComponent as DownIcon } from './icons/chevron-down-solid.svg';

// Use require() to import the PNG images
const EthIcon = require('./icons/eth.png');
const UsdtIcon = require('./icons/usdt.png');
const UsdcIcon = require('./icons/usdc.png');

const options = [
    { value: '1', label: 'ETH', icon: <img src={EthIcon} alt="ETH" className='currency-icon' /> },
    { value: '2', label: 'USDT', icon: <img src={UsdtIcon} alt="USDT" className='currency-icon' /> },
    { value: '3', label: 'USDC', icon: <img src={UsdcIcon} alt="USDC" className='currency-icon' /> },
];

const CustomSelect = ({ onChange, initialOption }) => {
    // Initialize selectedOption with the initialOption prop
    const [selectedOption, setSelectedOption] = useState(
        options.find(option => option.label === initialOption)
    );
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
