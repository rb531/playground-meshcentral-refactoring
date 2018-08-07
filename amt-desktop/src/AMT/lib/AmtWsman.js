/** 
* @description Intel(r) AMT WSMAN Stack
* @author Ylian Saint-Hilaire, ramu bachala
* @version v0.2.0
*/
import AmtWsmanComm from './AmtWsmanComm'
export default class WsmanStackService {

    constructor(props) {
        this.NextMessageId = 1;              // Next message number, used to label WSMAN calls.
        this.Address = '/wsman';
        this.host = props.host;
        this.port = props.port;
        this.user = props.user;
        this.tls = props.tls;
        this.pass = props.pass;
        this.extra = props.extra;

        this.comm = new AmtWsmanComm({host:this.host, port:this.port, user:this.user, pass: this.pass, tls:this.tls, extra: this.extra});
    }
    
    PerformAjax(postdata, callback, tag, pri, namespaces) {
        if (namespaces == undefined) namespaces = '';
        this.comm.PerformAjax('<?xml version=\"1.0\" encoding=\"utf-8\"?><Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:w="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns=\"http://www.w3.org/2003/05/soap-envelope\" ' + namespaces + '><Header><a:Action>' + postdata, function (data, status, tag) {
            if (status != 200) { callback(obj, null, { Header: { HttpError: status } }, status, tag); return; }
            var wsresponse = this.ParseWsman(data);
            if (!wsresponse || wsresponse == null) { callback(obj, null, { Header: { HttpError: status } }, 601, tag); } else { callback(obj, wsresponse.Header["ResourceURI"], wsresponse, 200, tag); }
        }, tag, pri);
    }

    CancelAllQueries(s) { this.comm.CancelAllQueries(s); }

    GetNameFromUrl(resuri) {
        var x = resuri.lastIndexOf("/");
        return (x == -1)?resuri:resuri.substring(x + 1);
    }
  
    ExecSubscribe(resuri, delivery, url, callback, tag, pri, selectors, opaque, user, pass) {
        var digest = "", digest2 = "";
        if (user != undefined && pass != undefined) { digest = '<t:IssuedTokens><t:RequestSecurityTokenResponse><t:TokenType>http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#UsernameToken</t:TokenType><t:RequestedSecurityToken><se:UsernameToken><se:Username>' + user + '</se:Username><se:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd#PasswordText">' + pass + '</se:Password></se:UsernameToken></t:RequestedSecurityToken></t:RequestSecurityTokenResponse></t:IssuedTokens>'; digest2 = '<Auth Profile="http://schemas.xmlsoap.org/ws/2004/08/eventing/DeliveryModes/secprofile/http/digest"/>'; }
        if (opaque != undefined && opaque != null) { opaque = '<a:ReferenceParameters>' + opaque + '</a:ReferenceParameters>'; } else { opaque = ""; }
        var data = "http://schemas.xmlsoap.org/ws/2004/08/eventing/Subscribe</a:Action><a:To>" + this.Address + "</a:To><w:ResourceURI>" + resuri + "</w:ResourceURI><a:MessageID>" + (this.NextMessageId++) + "</a:MessageID><a:ReplyTo><a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address></a:ReplyTo>" + this._PutObjToSelectorsXml(selectors) + digest + '</Header><Body><e:Subscribe><e:Delivery Mode="http://schemas.dmtf.org/wbem/wsman/1/wsman/' + delivery + '"><e:NotifyTo><a:Address>' + url + '</a:Address></e:NotifyTo>' + digest2 + '</e:Delivery><e:Expires>PT0.000000S</e:Expires></e:Subscribe>';
        this.PerformAjax(data + "</Body></Envelope>", callback, tag, pri, 'xmlns:e="http://schemas.xmlsoap.org/ws/2004/08/eventing" xmlns:t="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:se="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:m="http://x.com"');
    }

    ExecUnSubscribe(resuri, callback, tag, pri, selectors) {
        var data = "http://schemas.xmlsoap.org/ws/2004/08/eventing/Unsubscribe</a:Action><a:To>" + this.Address + "</a:To><w:ResourceURI>" + resuri + "</w:ResourceURI><a:MessageID>" + (this.NextMessageId++) + "</a:MessageID><a:ReplyTo><a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address></a:ReplyTo>" + this._PutObjToSelectorsXml(selectors) + '</Header><Body><e:Unsubscribe/>';
        this.PerformAjax(data + "</Body></Envelope>", callback, tag, pri, 'xmlns:e="http://schemas.xmlsoap.org/ws/2004/08/eventing"');
    }

    ExecUnSubscribe(resuri, callback, tag, pri, selectors) {
        var data = "http://schemas.xmlsoap.org/ws/2004/08/eventing/Unsubscribe</a:Action><a:To>" + this.Address + "</a:To><w:ResourceURI>" + resuri + "</w:ResourceURI><a:MessageID>" + (this.NextMessageId++) + "</a:MessageID><a:ReplyTo><a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address></a:ReplyTo>" + this._PutObjToSelectorsXml(selectors) + '</Header><Body><e:Unsubscribe/>';
        this.PerformAjax(data + "</Body></Envelope>", callback, tag, pri, 'xmlns:e="http://schemas.xmlsoap.org/ws/2004/08/eventing"');
    }

    ExecPut(resuri, putobj, callback, tag, pri, selectors) {
        var data = "http://schemas.xmlsoap.org/ws/2004/09/transfer/Put</a:Action><a:To>" + this.Address + "</a:To><w:ResourceURI>" + resuri + "</w:ResourceURI><a:MessageID>" + (this.NextMessageId++) + "</a:MessageID><a:ReplyTo><a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address></a:ReplyTo><w:OperationTimeout>PT60.000S</w:OperationTimeout>" + this._PutObjToSelectorsXml(selectors) + '</Header><Body>' + this._PutObjToBodyXml(resuri, putobj);
        this.PerformAjax(data + "</Body></Envelope>", callback, tag, pri);
    }

    ExecCreate(resuri, putobj, callback, tag, pri, selectors) {
        var objname = this.GetNameFromUrl(resuri);
        var data = "http://schemas.xmlsoap.org/ws/2004/09/transfer/Create</a:Action><a:To>" + this.Address + "</a:To><w:ResourceURI>" + resuri + "</w:ResourceURI><a:MessageID>" + (this.NextMessageId++) + "</a:MessageID><a:ReplyTo><a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address></a:ReplyTo><w:OperationTimeout>PT60S</w:OperationTimeout>" + this._PutObjToSelectorsXml(selectors) + "</Header><Body><g:" + objname + " xmlns:g=\"" + resuri + "\">";
        for (var n in putobj) { data += "<g:" + n + ">" + putobj[n] + "</g:" + n + ">" } 
        this.PerformAjax(data + "</g:" + objname + "></Body></Envelope>", callback, tag, pri);
    }

    ExecCreateXml(resuri, argsxml, callback, tag, pri) {
        var objname = this.GetNameFromUrl(resuri), selector = "";
        this.PerformAjax("http://schemas.xmlsoap.org/ws/2004/09/transfer/Create</a:Action><a:To>" + this.Address + "</a:To><w:ResourceURI>" + resuri + "</w:ResourceURI><a:MessageID>" + (this.NextMessageId++) + "</a:MessageID><a:ReplyTo><a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address></a:ReplyTo><w:OperationTimeout>PT60.000S</w:OperationTimeout></Header><Body><r:" + objname + " xmlns:r=\"" + resuri + "\">" + argsxml + "</r:" + objname + "></Body></Envelope>", callback, tag, pri);
    }



    ExecDelete(resuri, putobj, callback, tag, pri) {
        var data = "http://schemas.xmlsoap.org/ws/2004/09/transfer/Delete</a:Action><a:To>" + this.Address + "</a:To><w:ResourceURI>" + resuri + "</w:ResourceURI><a:MessageID>" + (this.NextMessageId++) + "</a:MessageID><a:ReplyTo><a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address></a:ReplyTo><w:OperationTimeout>PT60S</w:OperationTimeout>" + this._PutObjToSelectorsXml(putobj) + "</Header><Body /></Envelope>";
        this.PerformAjax(data, callback, tag, pri);
    }

    ExecGet(resuri, callback, tag, pri) {
        this.PerformAjax("http://schemas.xmlsoap.org/ws/2004/09/transfer/Get</a:Action><a:To>" + this.Address + "</a:To><w:ResourceURI>" + resuri + "</w:ResourceURI><a:MessageID>" + (this.NextMessageId++) + "</a:MessageID><a:ReplyTo><a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address></a:ReplyTo><w:OperationTimeout>PT60S</w:OperationTimeout></Header><Body /></Envelope>", callback, tag, pri);
    }

    ExecMethod(resuri, method, args, callback, tag, pri, selectors) {
        var argsxml = "";
        for (var i in args) { if (args[i] != null) { if (Array.isArray(args[i])) { for (var x in args[i]) { argsxml += "<r:" + i + ">" + args[i][x] + "</r:" + i + ">"; } } else { argsxml += "<r:" + i + ">" + args[i] + "</r:" + i + ">"; } } }
        this.ExecMethodXml(resuri, method, argsxml, callback, tag, pri, selectors);
    }

    ExecMethodXml(resuri, method, argsxml, callback, tag, pri, selectors) {
        this.PerformAjax(resuri + "/" + method + "</a:Action><a:To>" + this.Address + "</a:To><w:ResourceURI>" + resuri + "</w:ResourceURI><a:MessageID>" + (this.NextMessageId++) + "</a:MessageID><a:ReplyTo><a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address></a:ReplyTo><w:OperationTimeout>PT60S</w:OperationTimeout>" + this._PutObjToSelectorsXml(selectors) + "</Header><Body><r:" + method + '_INPUT' + " xmlns:r=\"" + resuri + "\">" + argsxml + "</r:" + method + "_INPUT></Body></Envelope>", callback, tag, pri);
    }

    ExecEnum(resuri, callback, tag, pri) {
        this.PerformAjax("http://schemas.xmlsoap.org/ws/2004/09/enumeration/Enumerate</a:Action><a:To>" + this.Address + "</a:To><w:ResourceURI>" + resuri + "</w:ResourceURI><a:MessageID>" + (this.NextMessageId++) + "</a:MessageID><a:ReplyTo><a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address></a:ReplyTo><w:OperationTimeout>PT60S</w:OperationTimeout></Header><Body><Enumerate xmlns=\"http://schemas.xmlsoap.org/ws/2004/09/enumeration\" /></Body></Envelope>", callback, tag, pri);
    }

    ExecPull(resuri, enumctx, callback, tag, pri) {
        this.PerformAjax("http://schemas.xmlsoap.org/ws/2004/09/enumeration/Pull</a:Action><a:To>" + this.Address + "</a:To><w:ResourceURI>" + resuri + "</w:ResourceURI><a:MessageID>" + (this.NextMessageId++) + "</a:MessageID><a:ReplyTo><a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address></a:ReplyTo><w:OperationTimeout>PT60S</w:OperationTimeout></Header><Body><Pull xmlns=\"http://schemas.xmlsoap.org/ws/2004/09/enumeration\"><EnumerationContext>" + enumctx + "</EnumerationContext><MaxElements>999</MaxElements><MaxCharacters>99999</MaxCharacters></Pull></Body></Envelope>", callback, tag, pri);
    }

    ParseWsman(xml) {
        try {
            if (!xml.childNodes) xml = this._turnToXml(xml);
            var r = { Header:{} }, header = xml.getElementsByTagName("Header")[0], t;
            if (!header) header = xml.getElementsByTagName("a:Header")[0];
            if (!header) return null;
            for (var i = 0; i < header.childNodes.length; i++) {
                var child = header.childNodes[i];
                r.Header[child.localName] = child.textContent;
            }
            var body = xml.getElementsByTagName("Body")[0];
            if (!body) body = xml.getElementsByTagName("a:Body")[0];
            if (!body) return null;
            if (body.childNodes.length > 0) {
                t = body.childNodes[0].localName;
                if (t.indexOf("_OUTPUT") == t.length - 7) { t = t.substring(0, t.length - 7); }
                r.Header['Method'] = t;
                r.Body = this._ParseWsmanRec(body.childNodes[0]);
		    }
            return r;
        } catch (e) {
            console.log("Unable to parse XML: " + xml);
            return null;
        }
    }

    // Private method
    _ParseWsmanRec(node) {
        var data, r = {};
        for (var i = 0; i < node.childNodes.length; i++) {
            var child = node.childNodes[i];
            if (child.childElementCount == 0) { data = child.textContent; } else { data = this._ParseWsmanRec(child); }
            if (data == 'true') data = true; // Convert 'true' into true
            if (data == 'false') data = false; // Convert 'false' into false

            var childObj = data;
			if (child.attributes.length > 0) {
				childObj = {'Value': data };
				for(var j = 0; j < child.attributes.length; j++) {
					childObj['@' + child.attributes[j].name] = child.attributes[j].value;
				}
			}
			
            if (r[child.localName] instanceof Array) { r[child.localName].push(childObj); }
            else if (r[child.localName] == undefined) { r[child.localName] = childObj; }
            else { r[child.localName] = [r[child.localName], childObj]; }
        }
        return r;
    }

    _PutObjToBodyXml(resuri, putObj) {
		if(!resuri || putObj === undefined || putObj === null) return '';
		var objname = this.GetNameFromUrl(resuri);
		var result = '<r:' + objname + ' xmlns:r="' + resuri + '">';

		for (var prop in putObj) {
			if (!putObj.hasOwnProperty(prop) || prop.indexOf('__') === 0 || prop.indexOf('@') === 0) continue;
			if (putObj[prop] === undefined || putObj[prop] === null || typeof putObj[prop] === 'function') continue;
			if (typeof putObj[prop] === 'object' && putObj[prop]['ReferenceParameters']) {
				result += '<r:' + prop + '><a:Address>' + putObj[prop].Address + '</a:Address><a:ReferenceParameters><w:ResourceURI>' + putObj[prop]['ReferenceParameters']["ResourceURI"] + '</w:ResourceURI><w:SelectorSet>';
				var selectorArray = putObj[prop]['ReferenceParameters']['SelectorSet']['Selector'];
				if (Array.isArray(selectorArray)) {
					for (var i=0; i< selectorArray.length; i++) {
						result += '<w:Selector' + this._ObjectToXmlAttributes(selectorArray[i]) + '>' + selectorArray[i]['Value'] + '</w:Selector>';
					}
				}
				else {
					result += '<w:Selector' + this._ObjectToXmlAttributes(selectorArray) + '>' + selectorArray['Value'] + '</w:Selector>';
				}
				result += '</w:SelectorSet></a:ReferenceParameters></r:' + prop + '>';
			}
			else {
			    if (Array.isArray(putObj[prop])) {
			        for (var i = 0; i < putObj[prop].length; i++) {
			            result += '<r:' + prop + '>' + putObj[prop][i].toString() + '</r:' + prop + '>';
			        }
			    } else {
			        result += '<r:' + prop + '>' + putObj[prop].toString() + '</r:' + prop + '>';
			    }
			}
		}

		result += '</r:' + objname + '>';
		return result;
	}

	/* 
	convert 
		{ @Name: 'InstanceID', @AttrName: 'Attribute Value'}
	into
		' Name="InstanceID" AttrName="Attribute Value" '
	*/
    _ObjectToXmlAttributes(objWithAttributes) {
		if(!objWithAttributes) return '';
		var result = ' ';
		for (var propName in objWithAttributes) {
			if (!objWithAttributes.hasOwnProperty(propName) || propName.indexOf('@') !== 0) continue;
			result += propName.substring(1) + '="' + objWithAttributes[propName] + '" ';
		}
		return result;
	}

    _PutObjToSelectorsXml(selectorSet) {
        if (!selectorSet) return '';
        if (typeof selectorSet == 'string') return selectorSet;
        if (selectorSet['InstanceID']) return "<w:SelectorSet><w:Selector Name=\"InstanceID\">" + selectorSet['InstanceID'] + "</w:Selector></w:SelectorSet>";
		var result = '<w:SelectorSet>';
		for(var propName in selectorSet) {
		    if (!selectorSet.hasOwnProperty(propName)) continue;
		    result += '<w:Selector Name="' + propName + '">';
		    if (selectorSet[propName]['ReferenceParameters']) {
		        result += '<a:EndpointReference>';
		        result += '<a:Address>' + selectorSet[propName]['Address'] + '</a:Address><a:ReferenceParameters><w:ResourceURI>' + selectorSet[propName]['ReferenceParameters']['ResourceURI'] + '</w:ResourceURI><w:SelectorSet>';
		        var selectorArray = selectorSet[propName]['ReferenceParameters']['SelectorSet']['Selector'];
		        if (Array.isArray(selectorArray)) {
		            for (var i = 0; i < selectorArray.length; i++) {
		                result += '<w:Selector' + this._ObjectToXmlAttributes(selectorArray[i]) + '>' + selectorArray[i]['Value'] + '</w:Selector>';
		            }
		        }
		        else {
		            result += '<w:Selector' + this._ObjectToXmlAttributes(selectorArray) + '>' + selectorArray['Value'] + '</w:Selector>';
		        }
		        result += '</w:SelectorSet></a:ReferenceParameters></a:EndpointReference>';
		    } else {
		        result += selectorSet[propName];
		    }
			result += '</w:Selector>';
		}
		result += '</w:SelectorSet>';
		return result;
	}

    _turnToXml(text) {
        if (window.DOMParser) {
            return new DOMParser().parseFromString(text, "text/xml");
        }
        else // Internet Explorer
        {
            var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = false;
            xmlDoc.loadXML(text);
            return xmlDoc;
        }
    }
};