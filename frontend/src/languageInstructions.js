import React from 'react';

const LanguageInstructions = ({ onClose }) => {
    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.content}>
                <button onClick={onClose} style={modalStyles.closeButton}>X</button>
                <h2 style={modalStyles.heading}>Enstriksyon ak Enfòmasyon (Instructions and Information)</h2>

                <h3 style={modalStyles.subHeading}>Tablo Agrikòl Ayiti (Haiti Agri-Tech Dashboard)</h3>
                <p style={modalStyles.paragraph}>
                    Sa a se yon zouti pou agrikiltè ayisyen yo pou ede yo detekte ak jere move zèb nan jaden yo.
                    Li itilize imaj dron pou idantifye move zèb epi bay rekòmandasyon tretman.
                </p>

                <h3 style={modalStyles.subHeading}>Telechaje Imaj Pa Ou (Upload Your Own Image)</h3>
                <p style={modalStyles.paragraph}>
                    Ou ka telechaje yon imaj jaden ou pou analiz. Asire w se yon fichye imaj (JPEG, PNG, elatriye).
                    Apre telechajman, sistèm nan ap trete imaj la epi detekte move zèb yo.
                </p>
                <ul>
                    <li style={modalStyles.listItem}>**Chwazi Imaj pou Telechaje:** Klike sou bouton sa a pou seleksyone yon imaj nan òdinatè ou.</li>
                    <li style={modalStyles.listItem}>**Ap telechaje...:** Endike imaj la ap telechaje kounye a.</li>
                    <li style={modalStyles.listItem}>**Imaj telechaje avèk siksè! Gade analiz anba a:** Konfime ke imaj ou te telechaje a byen resevwa epi trete.</li>
                    <li style={modalStyles.listItem}>**Tanpri telechaje yon fichye imaj (egzanp, JPEG, PNG).:** Avètisman si fichye a pa yon imaj.</li>
                    <li style={modalStyles.listItem}>**Telechajman imaj la echwe pou tretman. Tanpri eseye ankò.:** Erè si telechajman an pa reyisi.</li>
                </ul>

                <h3 style={modalStyles.subHeading}>Imaj Aktyèl & Deteksyon Move Zèb (Current Image & Weed Detections)</h3>
                <p style={modalStyles.paragraph}>
                    Seksyon sa a montre dènye imaj dron nan jaden an oswa imaj ou te telechaje a, ansanm ak kote move zèb yo detekte yo.
                    Bwat koulè yo ap make chak move zèb, epi lè ou pase sourit ou sou yon bwat, ou ka wè ki kalite move zèb li ye ak nivo konfyans deteksyon an.
                </p>
                <ul>
                    <li style={modalStyles.listItem}>**Ap montre done pou imaj...:** Endike si li se dènye imaj dron oswa imaj ou te telechaje a.</li>
                    <li style={modalStyles.listItem}>**Ap chaje done imaj inisyal yo...:** Message pandan y ap tann done.</li>
                </ul>

                <h3 style={modalStyles.subHeading}>Kat Distribisyon Move Zèb (Weed Distribution Map)</h3>
                <p style={modalStyles.paragraph}>
                    Kat sa a montre kote move zèb yo detekte nan jaden an. Pwen wouj yo endike kote chak move zèb ye.
                    Sa ka ede ou planifye ki kote pou entèvni.
                </p>

                <h3 style={modalStyles.subHeading}>Plan Tretman Move Zèb (Weed Treatment Plan)</h3>
                <p style={modalStyles.paragraph}>
                    Seksyon sa a bay rekòmandasyon espesifik sou fason pou jere diferan kalite move zèb.
                    Ou ka chwazi yon kalite move zèb nan lis la pou wè metòd tretman rekòmande yo ak nòt enpòtan.
                </p>
                <ul>
                    <li style={modalStyles.listItem}>**Chwazi Kalite Move Zèb:** Seleksyone move zèb ou vle enfòmasyon sou li.</li>
                    <li style={modalStyles.listItem}>**Pa gen move zèb detekte ankò, oswa done pa chaje.:** Message si pa gen move zèb jwenn.</li>
                    <li style={modalStyles.listItem}>**Metòd Rekòmande:** Lis metòd tretman.</li>
                    <li style={modalStyles.listItem}>**Nòt:** Enfòmasyon adisyonèl sou move zèb la ak tretman li.</li>
                </ul>

                <h3 style={modalStyles.subHeading}>Previzyon Tan (Weather Forecast)</h3>
                <p style={modalStyles.paragraph}>
                    Jere move zèb depann anpil de kondisyon metewolojik. Seksyon sa a bay previzyon tan aktyèl ak yon previzyon 5 jou.
                    Li bay konsèy pou agrikilti ki baze sou tanperati ak lapli.
                </p>
                <ul>
                    <li style={modalStyles.listItem}>**Kondisyon Aktyèl:** Enfòmasyon sou tanperati, imidite, van, ak lapli.</li>
                    <li style={modalStyles.listItem}>**Konsèy pou Agrikilti:** Rekòmandasyon ki baze sou kondisyon metewolojik yo.</li>
                    <li style={modalStyles.listItem}>**Previzyon 5 Jou:** Previzyon detaye pou senk jou kap vini yo.</li>
                    <li style={modalStyles.listItem}>**Prob. Lapli:** Pwobabilite pou lapli nan jou kap vini yo.</li>
                    <li style={modalStyles.listItem}>**Tanpri ranplase 'YOUR_OPENWEATHERMAP_API_KEY' ak vrè kle OpenWeatherMap API ou. / Pa t 'kapab jwenn done previzyon tan. Tanpri tcheke kle API ou ak koneksyon entènèt ou.:** Mesaj erè pou API kle.</li>
                </ul>

                <p style={modalStyles.footer}>
                    Si ou gen nenpòt kesyon oswa ou bezwen plis asistans, tanpri kontakte sipò teknik.
                </p>
            </div>
        </div>
    );
};

const modalStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        overflowY: 'auto', // Enable scrolling if content is long
    },
    content: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh', // Limit height to enable scrolling within modal
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
    },
    closeButton: {
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: 'none',
        border: 'none',
        fontSize: '1.5em',
        cursor: 'pointer',
        color: '#555',
    },
    heading: {
        fontSize: '2em',
        color: '#007bff',
        marginBottom: '20px',
        borderBottom: '2px solid #eee',
        paddingBottom: '10px',
    },
    subHeading: {
        fontSize: '1.5em',
        color: '#333',
        marginTop: '25px',
        marginBottom: '10px',
    },
    paragraph: {
        fontSize: '1em',
        lineHeight: '1.6',
        marginBottom: '15px',
        color: '#555',
    },
    ul: {
        listStyleType: 'disc',
        marginLeft: '20px',
        marginBottom: '15px',
    },
    listItem: {
        marginBottom: '8px',
        color: '#555',
    },
    footer: {
        marginTop: '30px',
        textAlign: 'center',
        fontStyle: 'italic',
        color: '#777',
    }
};

export default LanguageInstructions;