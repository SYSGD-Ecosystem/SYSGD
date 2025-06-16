import { english } from "./english";
import { spanish } from "./spanish";

const languages = {
    es: spanish,
    en: english
}

const getLanguage= (lang:string) => {
    switch(lang){
        case "es": return languages.es;
        case "en": return languages.en;
        default: return languages.en
    }
} ;

export default getLanguage