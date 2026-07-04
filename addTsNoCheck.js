/*
    *  ----------------------------------------------------  *
    *  -----  /addTsNoCheck.js  --  /addTsNoCheck.js  -----  *
    *  ----------------------------------------------------  *
*/

import fs from 'fs';
import path from 'path';


const targetDir = path.join(process.cwd(), 'src', 'scripts', 'js');

function addNoCheckRecursive(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            addNoCheckRecursive(fullPath); // recorrer subcarpetas

        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            
            const content = fs.readFileSync(fullPath, 'utf8');
            
            if (!content.startsWith('// @ts-nocheck')) {
                fs.writeFileSync(fullPath, '// @ts-nocheck\n' + content, 'utf8');
                console.log(`Agregado //@ts-nocheck a: ${fullPath}`);
            }

        }

    }

}


// Ejecutar
addNoCheckRecursive(targetDir);
console.log('Proceso de addTsNoCheck completado.');