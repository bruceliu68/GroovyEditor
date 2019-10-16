import React from 'react';
import ReactDOM from 'react-dom';

import GroovyEditor from './components/GroovyEditor';
// import GroovyEditor from "groovy-edit-react";

const defaultCode = "";
const getCode = (code) => {
    console.log(code);
}

ReactDOM.render(
    <GroovyEditor
        defaultCode={defaultCode}
        readOnly={false}
        height={300}
        theme="night"
        activeLine={true}
        fold={true}
        keywords={["const", "var"]}
        onChange={getCode}
    />,
    document.getElementById('app')
);
