export default function getSelectStyle() {
    return {
        control: (styles, {isFocused}) => ({
            ...styles,
            backgroundColor: '#fff',
            boxShadow: 'none',
            borderColor: isFocused ? '#106a90' : '#106a90',
            
            borderRadius: '3px',
            borderWidth: '0.05em',
            minHeight: '30px',
            ':hover': {
                borderColor: '#106a90'
            }
        }),
        dropdownIndicator: base => ({ ...base, padding: '2px' }), 
        indicatorsContainer: (provided) => ({
            ...provided,
            padding: '0px',
            margin: '0px',
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: '0px 2px',
            margin: '0px',
            maxHeight: '300px',
            overflow: 'overlay',
          }),
        input: (provided) => ({
            ...provided,
            margin: '0 0 0 10px',
            padding: '0px',
        }),
    
        placeholder: (provided) => ({
            ...provided,
            margin: '0 2px',
            padding: '0 2px',
        }),
        indicatorContainer: styles => ({
            ...styles,
            padding: '0px',
            margin: '0px',
        }),
        indicatorSeparator: (provided) => ({
            ...provided,
            padding: '0px',
            margin: '0px',
          }),
        clearIndicator: (base) => ({
            ...base,
            paddingTop: 0,
            paddingBottom: 0,
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: '#fff',
            border: '0.005em solid #106a9020',
            ':hover': {
                backgroundColor: '#F0F0F0'
            }
        }),
        multiValueRemove: (base) => ({
            ...base,
            ':hover': {
                backgroundColor: '#106a9050',
            },
        }),
        option: (styles, { isDisabled, isFocused, isSelected }) => {
            return {
                ...styles,
                backgroundColor: isSelected ? '#106a90' : isFocused ? '#106a9010' : '#fff',
                height: isSelected && isFocused ? '34px' : '34px',
                cursor: isDisabled ? 'not-allowed' : 'default',
                color: isFocused ? '#106a90' : '#106a90',
                
                ':active': {
                    backgroundColor: '#106a90',
                    color: '#106a90',
                },
    
                ':hover': {
                    backgroundColor: '#106a9010',
                    color: '#000',
                    height: '34px'
                },
            };
    
        },
    };
}



