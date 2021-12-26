const XMLDom = require('@xmldom/xmldom').DOMParser;

const getPluginNameFromXml = xml => {
 const doc = new XMLDom().parseFromString(xml, 'application/xml');
 return doc.getElementsByTagName('plugin')[0].getAttribute('id');
}

module.exports = getPluginNameFromXml;
