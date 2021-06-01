//------------------------------------------------------------------------------// worksheets.js//------------------------------------------------------------------------------
// Copyright (c) 2020 The Board of Trustees of the Leland Stanford Junior
// University.  All nonprofit research institutions may use this Software for
// any non-profit purpose, including sponsored research and collaboration.  All
// nonprofit research institutions may publish any information included in the
// Software.  This Software may not be redistributed.  It may not be used for
// commercial purposes.  For any questions regarding commercial use or
// redistribution, please contact the Office of Technology Licensing at Stanford
// University (info@otlmail.stanford.edu).
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS";
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
//------------------------------------------------------------------------------// global variables//------------------------------------------------------------------------------

indexing = true
dataindexing = true
ruleindexing = true

var lambda = seq();
var library = seq();

var user = '';
var folder = '';
var sheet = '';
var query = '';
var anchor = '';
var broadcast = false;
var reception = false;
var parameters = {};
var datasets = seq();
var channels = seq();

//------------------------------------------------------------------------------// initialize//------------------------------------------------------------------------------

function initialize ()
 {folder = 'anonymous' || getfolder() || worksheetuser();
  sheet = getsheet();
  query = getarguments();
  if (query!==false) {parameters = getparameters(query)};
  anchor = getanchor();
  if (anchor!==false) {anchor = read(anchor)};

  var widget = document.getElementById('library');  
  var source = widget.getAttribute('src');
  library = seq();
  definemorerules(library,readdata(widget.textContent));
  if (source) {definemorerules(library,getrules(folder,source))};

  widget = document.getElementById('lambda');
  broadcast = widget.getAttribute('broadcast')==='true';
  reception = widget.getAttribute('reception')==='true';
  if (widget.getAttribute('src')) {loadlambda()}
     else {definefacts(lambda,readdata(widget.textContent))};

  var widgets = document.getElementsByTagName('dataset');
  for (var i=0; i<widgets.length; i++)
      {broadcast = (broadcast || widgets[i].getAttribute('broadcast')==='true');
       reception = (reception || widgets[i].getAttribute('reception')==='true');
       if (widgets[i].getAttribute('src')) {loaddataset(folder,widgets[i].id)}
          else {var theory = seq();
                definefacts(theory,readdata(widgets[i].textContent));
                datasets[widgets[i].id] = theory}};

  widgets = document.getElementsByTagName('channel');
  for (var i=0; i<widgets.length; i++)
      {broadcast = (broadcast || widgets[i].getAttribute('direction')==='outbound');
       reception = (reception || widgets[i].getAttribute('direction')==='inbound');
       var source = widgets[i].getAttribute('src');
       if (source)
          {channels[widgets[i].id] = getmessages(folder,source)}
          else {channels[widgets[i].id] = readdata(widgets[i].textContent)}};

  fullreact('load');
  if (reception) {setTimeout(listen,1000)};
  return true}

//------------------------------------------------------------------------------

function getarguments ()
 {var parts = location.href.split("?");
  if (parts.length<=1) {return false};
  return parts[1]}

function getparameters (query)
 {var pairs = query.split('&');
  var params = {};
  for (var i=0; i<pairs.length; i++)
      {var args = pairs[i].split('=');
       if (args.length===2 && args[0].length>0 && args[1].length>0)
          {var attr = read(args[0]);
           var value = read(args[1]);
           params[attr] = value}};
  return params}

function getfolder ()
 {var args = location.href.split("?");
  if (args.length<=1) {return false};
  var parts = args[1].split("&");
  for (var i=0; i<parts.length; i++)
      {if (parts[i].indexOf('folder=')===0)
          {return parts[i].slice(7)}};
  return 'anonymous'}

function getsheet ()
 {var args = location.href.split("?");
  if (args.length<=1) {return false};
  var parts = args[1].split("&");
  for (var i=0; i<parts.length; i++)
      {if (parts[i].indexOf('sheet=')===0)
          {return parts[i].slice(6)}};
  return 'anonymous'}

function getanchor ()
 {var args = location.href.split("?");
  if (args.length<=1) {return false};
  var parts = args[1].split("&");
  for (var i=0; i<parts.length; i++)
      {if (parts[i].indexOf('anchor=')===0)
          {return decodeURIComponent(parts[i].slice(7))}};
  return false}

//------------------------------------------------------------------------------
// inputs
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
// mod
//------------------------------------------------------------------------------

function modtext (widget)
 {var item = read(widget.id);
  var value = read(widget.value.toLowerCase());
  var action = seq('select',item,value);
  fullreact(action);
  return true}

function modstring (widget)
 {var item = read(widget.id);
  var value = quotify(widget.value.replace(/"/g,"'"));
  var action = seq('select',item,value);
  fullreact(action);
  return true}

function modselector (widget)
 {var item = read(widget.id);
  var value = read(widget.value);
  var action = seq('select',item,value);
  fullreact(action);
  return true}

function modmenu (widget)
 {var item = read(widget.parentNode.id);
  var value = read(widget.value);
  if (widget.selected)
     {var action = seq('select',item,value);
      fullreact(action)}
     else {var action = seq('deselect',item,value);
           fullreact(action)};
  return true}

function modradio (widget)
 {var item = read(widget.name);
  var value = read(widget.value);
  var action = seq('select',item,value);
  fullreact(action);
  return true}

function modcheck (widget)
 {var item = read(widget.name);
  var value = read(widget.value);
  if (widget.checked)
     {var action = seq('select',item,value);
      fullreact(action)}
     else {var action = seq('deselect',item,value);
           fullreact(action)};
  return true}

function modbutton (widget)
 {return fullreact(seq('click',read(widget.id)))}

function modsubmit (widget)
 {fullreact(seq('click',read(widget.id)));
  return widget.form.submit()}

function modremote (widget)
 {fullreact(seq('click',read(widget.id)));
  return posteval(widget.form.action,new FormData(widget.form))}

function modvalue (item,newvalue)
 {if (newvalue==='error') {return false};
  var oldvalue = compfindx('Z',seq('value',item,'Z'),lambda,seq());
  if (oldvalue) {dropfact(seq('value',item,oldvalue),lambda)};
  savefact(seq('value',item,newvalue),lambda);
  document.getElementById('lambda').changed = true;
  return true}

//------------------------------------------------------------------------------

function modbroadcast (button)
 {if (button.value==='Start autosave')
     {dobroadcast();
      button.value = 'Stop autosave';
      return true};
  dounbroadcast();
  button.value = 'Start autosave';
  return true}

function modreceive (button)
 {if (button.value==='Stop autoload')
     {doreceive();
      button.value = 'Start autoload';
      return true};
  dounreceive();
  button.value = 'Stop autoload';
  return true}

function modconnector (button)
 {if (button.value==='Connect')
     {doconnect();
      button.value = 'Disconnect';
      return true};
  dodisconnect();
  button.value = 'Connect';
  return true}

//------------------------------------------------------------------------------
// timer
//------------------------------------------------------------------------------

var ticker = false;

function dostep ()
 {return fullreact('tick')}

function doplay ()
 {document.getElementById('stepper').disabled = true;
  document.getElementById('player').disabled = true;
  document.getElementById('pauser').disabled = false;
  document.getElementById('stepper').style.backgroundColor = '#efefef';
  document.getElementById('player').style.backgroundColor = '#efefef';
  document.getElementById('pauser').style.backgroundColor = '#ffffff';
  run();
  return true}

function dopause ()
 {document.getElementById('stepper').disabled = false;
  document.getElementById('player').disabled = false;
  document.getElementById('pauser').disabled = true;
  document.getElementById('stepper').style.backgroundColor = '#ffffff';
  document.getElementById('player').style.backgroundColor = '#ffffff';
  document.getElementById('pauser').style.backgroundColor = '#efefef';
  if (ticker) {clearTimeout(ticker); ticker = false};
  return true}

function run()
 {fullreact('tick');
  var tickinterval = compfindx("X",seq("tickinterval","X"),lambda,library);
  var interval = parseFloat(tickinterval || 500);
  ticker = setTimeout(run,interval);
  return true}

//------------------------------------------------------------------------------
// Updating
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
// fullreact, react
//------------------------------------------------------------------------------

function fullreact (event)
 {react(event);
  populatesheet();
  if (broadcast) {autosavedata(folder)};
  return true}

function react (event)
 {return compexecute(event,lambda,library)}

function update (adds,dels,facts,rules)
 {var updates = hypoupdates(adds,dels,facts,rules);
  for (var i=0; i<updates.length; i++)
      {var datum = updates[i];
       if (symbolp(datum)) {continue};
       if (datum[0]==='not')
          {var datum = datum[1];
           if (symbolp(datum))
              {dropfact(datum,facts);
               document.getElementById('lambda').changed = true}
              else if (datum[0]==='true')
                      {dropfact(datum[1],getdataset(datum[2]));
                       document.getElementById(datum[2]).changed = true}
              else {dropfact(datum,facts);
                    document.getElementById('lambda').changed = true}}};
  for (var i=0; i<updates.length; i++)
      {var datum = updates[i];
       if (symbolp(datum))
          {savefact(datum,facts);
           document.getElementById('lambda').changed = true}
          else if (datum[0]==='true')
                  {savefact(datum[1],getdataset(datum[2]));
                   document.getElementById(datum[2]).changed = true}
          else if (datum[0]==='message') {savemessage(datum)}
          else if (datum[0]==='source') {savesource(datum)}
          else if (datum[0]==='alert') {alert(datum[1])}
          else if (datum[0]==='not') {continue}
          else {savefact(datum,facts);
                document.getElementById('lambda').changed = true}};
  return true}

function react (event)
 {return updates(compexpand(event,lambda,library),lambda,library)}

function updates (deltas,facts,rules)
 {for (var i=0; i<deltas.length; i++)
      {var datum = deltas[i];
       if (symbolp(datum)) {continue};
       if (datum[0]==='not')
          {var datum = datum[1];
           if (symbolp(datum))
              {dropfact(datum,facts);
               document.getElementById('lambda').changed = true}
              else if (datum[0]==='true')
                      {dropfact(datum[1],getdataset(datum[2]));
                       document.getElementById(datum[2]).changed = true}
              else {dropfact(datum,facts);
                    document.getElementById('lambda').changed = true}}};
  for (var i=0; i<deltas.length; i++)
      {var datum = deltas[i];
       if (symbolp(datum))
          {savefact(datum,facts);
           document.getElementById('lambda').changed = true}
          else if (datum[0]==='true') {savetrue(datum)}
          else if (datum[0]==='source') {savesource(datum)}
          else if (datum[0]==='message') {savemessage(datum)}
          else if (datum[0]==='alert') {alert(datum[1])}
          else if (datum[0]==='not') {continue}
          else {savefact(datum,facts);
                document.getElementById('lambda').changed = true}};
  return true}

function savetrue (fact)
 {savefact(fact[1],getdataset(fact[2]));
  document.getElementById(fact[2]).changed = true;
  return true}

function savesource (p)
 {var widget = document.getElementById(p[1]);
  var oldsource = widget.getAttribute('src');
  var newsource = grind(p[2]);
  if (oldsource===newsource) {return false};
  widget.setAttribute('src',newsource);
  if (p[1] in channels)
     {loadchannel(folder,p[1]);
      return true};
  loaddataset(folder,p[1]);
  document.getElementById(p[1]).changed = true;
  return true}

function savemessage (msg)
 {var widget = document.getElementById(msg[2]);
  var source = widget.getAttribute('src');
  if (source && widget.getAttribute('direction')==='outbound')
     {channels[msg[2]].push(msg[1]); return true};
  enqueue(msg);
  return true}

function enqueue (event)
 {console.log('Queuing: ' + event);
  setTimeout(function () {fullreact(event)},0)};

//------------------------------------------------------------------------------
// outputs
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
// populatesheet
//------------------------------------------------------------------------------

function populatesheet ()
 {updatecontents();
  updatetables();
  var widgets = document.querySelectorAll('[id]');
  for (var i=0; i<widgets.length; i++) {populate(widgets[i])};
  var widgets = document.querySelectorAll('[name]');
  var names = [];
  for (var i=0; i<widgets.length; i++)
   {var name = widgets[i].getAttribute('name');
    if (!findq(name,names)) {names.push(name); populatespread(widgets[i])}}
  reposition();
  return true}

function updatecontents ()
 {var pattern = seq('innerhtml','X','Y');
  var data = compfinds(pattern,pattern,lambda,library);
  for (var i=0; i<data.length; i++)
      {var id = grind(data[i][1]);
       var value = stripquotes(data[i][2]);
       document.getElementById(id).innerHTML = value;}
  return true}

function updatecontents ()
 {var pattern = seq('innerhtml','X','Y');
  var data = compfinds(pattern,pattern,lambda,library);
  while (data.length>0)
   {//console.log(data);
    var leftovers = [];
    for (var i=0; i<data.length; i++)
        {var id = grind(data[i][1]);
         var widget = document.getElementById(id);
         if (widget) {widget.innerHTML = stripquotes(data[i][2])}
            else {leftovers.push(data[i])}};
    //console.log(leftovers);
    data = (leftovers.length<data.length) ? leftovers : []};
  return true}

function updatetables ()
 {var tables = document.querySelectorAll('table[id]');
  for (var i=0; i<tables.length; i++)
      {var widget = tables[i];
       if (widget.getAttribute('type')==='table') {updatetable(widget)}
          else if (widget.classList.contains('datatable'))
                  {updatedatatable(widget)}
          //else {updaterows(widget)}
          };
  return true}

//------------------------------------------------------------------------------

function updatetable (widget)
 {var id = read(widget.id);
  var arity = getarity(id,library);
  var pattern = makepattern(id,arity);
  var data = sortfinds(pattern,pattern,lambda,library);
  var styles = getstyles(widget,arity);
  var bodies = widget.tBodies;
  if (bodies.length===0)
     {widget.appendChild(document.createElement('tbody'));
      bodies = widget.tBodies};
  var body = bodies[0];
  while (body.rows.length>0) {body.deleteRow(0)};
  for (var i=0; i<data.length; i++)
      {var row = body.insertRow(i);
       for (var j=0; j<arity; j++)
           {var cell = row.insertCell(j);
            cell.innerHTML = display(data[i][j+1],styles[j])}};
  return true}

function makepattern(relation,n)
 {var pattern = seq(relation);
  for (var i=0; i<n; i++) {pattern.push('V' + (i+1))};
  return pattern}

function getstyles (widget,arity)
 {var styles = seq();
  var head = widget.tHead;
  if (head===null) {return new Array(arity).fill(null)};
  var cells = head.rows[0].cells;
  for (var j=0; j<cells.length; j++)
      {styles.push(cells[j].getAttribute('displaystyle'))};
  return styles}

function display (x,style)
 {if (style===null) {return grind(x)}
  if (style==='stringfield') {return stripquotes(x)};
  var xs = compfindx('Out',seq(style,x,'Out'),lambda,library);
  if (xs) {return stripquotes(xs)};
  return grind(x)}

function tablep (widget)
 {if (widget.nodeName!=='TABLE') {return false};
  var id = read(widget.id);
  var data = indexees(id,lambda);
  for (var i=0; i<data.length; i++)
      {if (data[i][0]===id) {return true}};
  for (var i=0; i<library.length; i++)
      {if (operator(library[i])===id) {return true}};
  return false}

function getarity (relation)
 {var data = indexees(relation,lambda);
  for (var i=0; i<data.length; i++)      {if (data[i][0]===relation) {return data[i].length-1}};  return getrulearity(relation,library)}

//------------------------------------------------------------------------------

function updatedatatable (widget)
 {populateattributes(widget);
  populatestyles(widget);
  var tBody = widget.tBodies, tHead = widget.tHead;
	var relconst = widget.getAttribute("id"), arity = parseInt(widget.getAttribute("arity"));
	var query = [relconst];
	for (var i = 0; i < arity; i++)
		query.push("X" + (i + 1));
	var db = sortfinds(query,query,lambda,library);
	var headerbg = widget.getAttribute("header-background");
	var headercolor = widget.getAttribute("header-color");
	var headeralign = widget.getAttribute("header-alignment");
	var headerrows = tHead.rows;
	var editcolor = widget.getAttribute("editable-row-color");
	for (var i = 0; i < headerrows.length; i++)
	{
		headerrows[i].style["background-color"] = headerbg;
		headerrows[i].style["color"] = headercolor;
		headerrows[i].style["text-align"] = headeralign;
	}

	var styles = getstyles(widget);
	if (!tBody.length)
	{
		widget.createTBody();
	}
	tBody = widget.tBodies[0];

	if (!widget.getAttribute("editable"))
	{
		while (tBody.rows.length>0) tBody.deleteRow(0);
		for (var i = 0; i < db.length; i++)
		{
		  var row = tBody.insertRow(i);
		  for (var j=0; j < arity; j++)
		  {
		    var cell = row.insertCell(j);
		    cell.style['text-align'] = 'inherit';
		    cell.innerHTML = display(db[i][j+1],styles[j]);
		  }
		}
		return;
	}

	var tr = tBody.querySelectorAll("tr[row]");
	var ui = [];
	for (var i = 0; i < tr.length; i++)
	{
		var rowid = read(tr[i].getAttribute("row"));
		var readonly = tr[i].querySelectorAll("input").length == 0;
		if (!readonly)
			tr[i].style["background-color"] = editcolor;
		if (!find(rowid,db))
		{	
			if (readonly)
				deleterow(tr[i]);
		}
		else if (readonly)
		{
			for (var j = 0; j < arity; j++)
			{
				tr[i].cells[j].innerHTML = display(rowid[j+1],styles[j]);
			}
		}
		ui.push(rowid);
	}
	tr = tBody.querySelectorAll("tr:not([row])");
	for (var i = 0; i < tr.length; i++)
		tr[i].style["background-color"] = editcolor;
	var inserts = difference(db,ui);
	for (var i = 0; i < inserts.length; i++)
      	addtablerow(widget.tFoot.rows[0].cells[0],{readonly: true, values: inserts[i].slice(1)});}

function addtablerow (e,o)
 {o = typeof o == "undefined"? {}: o; 
	var table = e.parentNode.parentNode.parentNode;
	var tBody = table.tBodies;
	if (!tBody.length)
		tBody = table.createTBody();
	else
		tBody = tBody[0];

	var arity = parseInt(table.getAttribute("arity"));
	var styles = getstyles(table);
	var row = tBody.insertRow(tBody.rows.length);
	if ('values' in o)
		row.setAttribute("row",grind([table.getAttribute("id")].concat(o["values"])));
	if (!('readonly' in o))
		row.style['background-color'] = table.getAttribute("editable-row-color");
	else
		row.style['background-color'] = '';
	for (var i = 0; i < arity + 2; i++)
	{
		var col = row.insertCell(row.cells.length);
		col.style['text-align'] = 'center';
		if (i < arity)
		{
			var readonly = 'readonly' in o;
			if (!readonly)
			{
				col.innerHTML = "<input type='text' style='width: 100%; box-sizing: border-box; background-color: transparent; font-family: inherit; font-size: inherit; color: inherit;' />";
				if ('values' in o)
				{
					col.querySelector("input").value = o['values'][i];
				}
			}
			else
				col.innerHTML = display(o['values'][i],styles[i]);
		}
		else if (i == arity)
		{
			col.innerHTML = "<span style='cursor: pointer;' onclick='editrow(this);'>&#9998;</span>";
			col.style["text-align"] = "center";
		}
		else
		{
			col.innerHTML = "<span style='cursor: pointer;' onclick='deleterow(this.parentNode.parentNode,true);'>&#10005;</span>";
			col.style["text-align"] = "center";}}}

function editrow (e)
 {var row = e.parentNode.parentNode, table = row.parentNode.parentNode, tHead = table.tHead, arity = parseInt(table.getAttribute("arity"));
  var types = [], hrow = tHead.rows[0], relconst = table.getAttribute("id"), cells = [relconst];
  var styles = getstyles(table);
  var invalidrow = false;
  var edit = row.querySelectorAll("input").length == 0;
  var oldrow = row.getAttribute("row");
  if (edit)
	{
		oldrow = read(oldrow);
		for (var i = 0; i < arity; i++)
		{
			row.cells[i].innerHTML = "<input type='text' style='width: 100%; box-sizing: border-box; background-color: transparent; font-family: inherit; font-size: inherit; color: inherit;' />";
			row.cells[i].querySelector("input").value = grind(oldrow[i+1]);
		}
		row.style['background-color'] = table.getAttribute("editable-row-color");
	}
	else
	{
		for (var i = 0; i < arity; i++)
		{
			var value = grind(read(row.cells[i].querySelector("input").value));
			cells.push(read(value));
			var isempty = read(row.cells[i].querySelector("input").value) == "eof";
			if (isempty) invalidrow = true;
		}
		var tablerow = grind(cells);
		if (!invalidrow) 
		{
			row.style['background-color'] = '';
			for (var i = 0; i < arity; i++)
				row.cells[i].innerHTML = display(cells[i+1],styles[i]);
			if (oldrow)
			{
				oldrow = read(oldrow);
				if (!compfinds(cells,cells,lambda,library).length)
				{var action = seq("updaterow",oldrow,cells);
                                 react(action);
					row.setAttribute("row",tablerow)}
				else if (!equalp(oldrow,cells))
				{deleterow(row)}}
			else
			{
				if (!compfinds(cells,cells,lambda,library).length)
				{var action = seq("insertrow",cells);
                                 react(action);
					row.setAttribute("row",tablerow);	
				document.getElementById('lambda').changed = true}
				else deleterow(row)}}}
	populatesheet();
	if (broadcast) {autosavedata(folder)}}

function deleterow (e,f)
 {var row = e;
  var rowid = row.getAttribute("row");
  row.parentNode.removeChild(row);
  if (rowid)
     {var action = seq("deleterow",read(rowid));
      react(action);
      if (f)
         {populatesheet();
          if (broadcast) {autosavedata(folder)}}}}

//------------------------------------------------------------------------------

function updaterows (widget)
 {var id = read(widget.id);
  var data = sortfinds('Row',seq('row',id,'Row'),lambda,library);
  var styles = getstyles(widget);
  var bodies = widget.tBodies;
  if (bodies.length===0)
     {widget.appendChild(document.createElement('tbody'));
      bodies = widget.tBodies};
  var body = bodies[0];
  while (body.rows.length>0) {body.deleteRow(0)};
  for (var i=0; i<data.length; i++)
      {var row = body.insertRow(i);
       for (var j=0; j<styles.length; j++)
           {var cell = row.insertCell(j);
            cell.innerHTML = display(data[i][j+1],styles[j])}};
  return true}

//------------------------------------------------------------------------------

var populators = [];

function populate (widget)
 {if (widget.type==='hidden') {return populatetext(widget)};
  if (widget.type==='text' & !widget.hasAttribute('autoquote')) {return populatetext(widget)};
  if (widget.type==='text' & widget.hasAttribute('autoquote')) {return populatestring(widget)};
  if (widget.type==='textarea') {return populatetextarea(widget)};
  if (widget.type==='range') {return populatetext(widget)};
  if (widget.type==='select-one') {return populateselector(widget)};
  if (widget.type==='select-multiple') {return populatemenu(widget)};
  var handler = populators[widget.tagName];
  if (handler) {return handler.call(null,widget)};
  populateattributes(widget);
  populatestyles(widget);
  return false}

function populatetext (widget)
 {var id = read(widget.id);
  var value = findvalue(id);
  if (!value) {value = ''} else {value = grind(value)};
  if (document.activeElement!==widget) {widget.value = value};
  populateattributes(widget);
  populatestyles(widget);
  return true}

function populatestring (widget)
 {var id = read(widget.id);
  var value = findvalue(id);
  if (!value) {value = ''} else {value = stripquotes(value)};
  if (document.activeElement!==widget) {widget.value = value};
  populateattributes(widget);
  populatestyles(widget);
  return true}

function populatetextarea (widget)
 {if (widget.id==='lambda' || widget.id==='library') {return false};
  var id = read(widget.id);
  var value = findvalue(id);
  if (!value) {value = ''} else {value = stripquotes(value)};
  if (document.activeElement!==widget) {widget.value = value};
  populateattributes(widget);
  populatestyles(widget);
  return true}

function populateselector (widget)
 {populateoptions(widget);
  var id = read(widget.id);
  var value = findvalue(id);
  var flag = false;
  if (!value) {value = ''} else {value = grind(value)};
  for (var i=0; i<widget.options.length; i++)
      {if (widget.options[i].value==value)
          {flag = true; widget.options[i].selected = true; break}};
  if (!flag) {widget.selectedIndex = -1};
  populateattributes(widget);
  populatestyles(widget);
  return true}

function populatemenu (widget)
 {populateoptions(widget);
  var id = read(widget.id);
  var answers = findholds(id);
  for (var i=0; i<answers.length; i++) {answers[i] = grind(answers[i])};
  for (var i = 0; i<widget.options.length; i++)
      {if (find(widget.options[i].value,answers))
          {widget.options[i].selected = true}
          else {widget.options[i].selected = false}};
  populateattributes(widget);
  populatestyles(widget);
  return true}

function findvalue (id)
 {return compfindx('Y',seq('value',id,'Y'),lambda,library)}

function findholds (id)
 {return compfinds('Y',seq('holds',id,'Y'),lambda,library)}

//------------------------------------------------------------------------------

function populatespread (widget)
 {if (widget.type==='radio') {return populateradiobuttonfield(widget)};
  if (widget.type==='checkbox') {return populatecheckboxfield(widget)}}

function populatecheckboxfield (widget)
 {var name = read(widget.name);
  var answers = findholds(name);
  for (var i=0; i<answers.length; i++) {answers[i] = grind(answers[i])};
  var options = document.getElementsByName(widget.name);
  for (var i = 0; i<options.length; i++)
      {if (find(options[i].value,answers)) {options[i].checked = true}
          else {options[i].checked = false}};
  return true}

function populateradiobuttonfield (widget)
  {var name = read(widget.name);
   var value = findvalue(name);
   var options = document.getElementsByName(widget.name);
   for (var i = 0; i<options.length; i++)
       {if (options[i].value===value) {options[i].checked = true}
           else {options[i].checked = false}};
  return true};

//------------------------------------------------------------------------------

function populateoptions (widget)
 {var id = widget.id;
  var options = sortfinds('Y',seq('option',id,'Y'),lambda,library);
  if (options.length===0) {return false};
  while (widget.length>0) {widget.remove(0)};
  for (var j=0; j<options.length; j++)
     {var option = document.createElement('option');
      var value = grind(options[j]);
      option.value = value;
      option.text = stripquotes(value);
      if (widget.multiple)
         {option.name = id;
          option.onclick = 'modmenu(this)'};
          widget.add(option)};
  return true}

function populateattributes (widget)
 {var id = read(widget.id);
  var pattern = seq('attribute',id,'A','Y');
  var data = compfinds(pattern,pattern,lambda,library);
  for (var i=0; i<data.length; i++)
      {var id = grind(data[i][1]);
       if (id==='id') {continue};
       var property = stripquotes(data[i][2]);
       var val = stripquotes(data[i][3]);
       if (property==='disabled' && val==='false')
          {widget.disabled = false}
       else if (property==='readonly' && val==='false')
               {widget.removeAttribute('readonly')}
       else {widget.setAttribute(property,val)}};
  return true}

function populatestyles (widget)
 {var id = read(widget.id);
  var pattern = seq('style',id,'A','Y');
  var data = compfinds(pattern,pattern,lambda,library);
  for (var i=0; i<data.length; i++)
      {var property = stripquotes(data[i][2]);
       var style = stripquotes(data[i][3]);
       widget.style[property] = style};
  return true}

//------------------------------------------------------------------------------
//reposition
// xoffset, yoffset: numeric, {left, center, right}, {top, center, bottom};
// xref, yref: ids
//------------------------------------------------------------------------------

function reposition ()
 {var a = document.querySelectorAll("[yref],[xref],[xoffset],[yoffset]");
  var all = [];
  for (var i=0; i<a.length; i++) {all.push(a[i])};
  for (var i=0; i<all.length; i++) {all[i].removeAttribute("positioned")};
  for (var i=0; i<all.length; i++)
      {if (!all[i].getAttribute("positioned")) {position(all[i])}};
  return true}

function position (w)
 {var xref = document.getElementById(w.getAttribute("xref")||"");
  var xoffset = w.getAttribute("xoffset");
  var yref = document.getElementById(w.getAttribute("yref")||"");
  var yoffset = w.getAttribute("yoffset");

  var left = 0, top = 0;

  var grp = closestgroup(w.parentNode);
  if (grp)
     {if (!grp.getAttribute("positioned")) position(grp);
      var lt = getlefttop(grp);
      left = parseFloat(lt[0]), top = parseFloat(lt[1])}

  if (xref && isrelative(xref) && !xref.getAttribute("positioned"))
		position(xref);
  if (yref && isrelative(yref) && !yref.getAttribute("positioned"))
		position(yref);

  var em = document.querySelector("._main")? document.querySelector("._main"): document.body;

  if (!xoffset)
		xoffset = xref? 0: parseFloat(w.getAttribute("data-x") || 0);
	else if (xoffset == "left")
		xoffset = -1 * parseFloat(getComputedStyle(w).width);
	else if (xoffset == "right")
		xoffset = xref? parseFloat(getComputedStyle(xref).width): parseFloat(w.getAttribute("data-x") || 0);
	else if (xoffset == "center")
		xoffset = ((xref? parseFloat(getComputedStyle(xref).width): parseFloat(em.scrollWidth)) - parseFloat(getComputedStyle(w).width)) / 2;
	else 
		xoffset = xoffset.length && !isNaN(xoffset)? xoffset: parseFloat(w.getAttribute("data-x") || 0);

  if (!yoffset)
		yoffset = yref? 0: parseFloat(w.getAttribute("data-y") || 0);
	else if (yoffset == "top")
		yoffset = -1 * parseFloat(getComputedStyle(w).height);
	else if (yoffset == "bottom")
		yoffset = yref? parseFloat(getComputedStyle(yref).height): parseFloat(w.getAttribute("data-y") || 0);
	else if (yoffset == "center")
		yoffset = ((yref? parseFloat(getComputedStyle(yref).height): parseFloat(em.scrollHeight)) - parseFloat(getComputedStyle(w).height)) / 2;
	else 
		yoffset = yoffset.length && !isNaN(yoffset)? yoffset: parseFloat(w.getAttribute("data-y") || 0);

  var x, y;
  var yo = document.querySelector("._main")? 24: 0;

  if (xref)
		x = getAbsoluteBoundingRect(xref).left + parseFloat(xoffset) - left;//xref.getBoundingClientRect().left + parseFloat(xoffset);
	else x = /*parseFloat(w.getAttribute("data-x") || 0) + */parseFloat(xoffset);
  if (yref)
		y = getAbsoluteBoundingRect(yref).top + parseFloat(yoffset) - yo - top;//yref.getBoundingClientRect().top + parseFloat(yoffset) - 24;
	else y = /*parseFloat(w.getAttribute("data-y") || 0) + */parseFloat(yoffset);

  w.setAttribute("data-x",x);
  w.setAttribute("data-y",y);

  var transform = w.style["transform"] || w.style["-webkit-transform"] || w.style["-moz-transform"] || "";
    
  var prev = transform;
  var translate = "translate(" + x + "px," + y + "px)";  
  if (transform.match(/translate\([^)]+\)/g))
     transform = transform.replace(/translate\([^)]+\)/g,translate);
      else
        transform = translate + " " + transform;
   	w.style["-moz-transform"] = w.style["-webkit-transform"] = w.style["transform"] = transform;
   	w.setAttribute("positioned",true)}

function closestgroup (w)
 {if (w.nodeName == "BODY") {return null}
     else if (w.getAttribute("widget") && w.getAttribute("widget") == "group")
          {return w}
     else {return closestgroup(w.parentNode)}}

function isrelative (w)
 {return w.getAttribute("xref") || w.getAttribute("yref") || false}

function getlefttop (w)
 {var x = parseFloat(w.getAttribute("data-x")||0);
  var y = parseFloat(w.getAttribute("data-y")||0);
  var g = closestgroup(w.parentNode);
  if (!g) {return [x,y]};
  var a = getlefttop(g);
  return [a[0] + x,a[1] + y]}

function getAbsoluteBoundingRect (el) 
 {var doc  = document,
        win  = window,
        body = doc.body,

        // pageXOffset and pageYOffset work everywhere except IE <9.

        offsetX = win.pageXOffset !== undefined ? win.pageXOffset :
            (doc.documentElement || body.parentNode || body).scrollLeft,
        offsetY = win.pageYOffset !== undefined ? win.pageYOffset :
            (doc.documentElement || body.parentNode || body).scrollTop,

        rect = el.getBoundingClientRect();

    if (el !== body) 
       {var parent = el.parentNode;

        // The element's rect will be affected by the scroll positions of
        // *all* of its scrollable parents, not just the window, so we have
        // to walk up the tree and collect every scroll offset. Good times.

        while (parent !== body && parent !== null) 
         {offsetX += parent.scrollLeft;
          offsetY += parent.scrollTop;
          parent   = parent.parentNode}}

    return {bottom: rect.bottom + offsetY,
            height: rect.height,
            left  : rect.left + offsetX,
            right : rect.right + offsetX,
            top   : rect.top + offsetY,
            width : rect.width}}

//------------------------------------------------------------------------------
// server interaction
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
// automatic operation
//------------------------------------------------------------------------------

function dobroadcast ()
 {broadcast = true;
  if (broadcast) {autosavedata(folder)};
  return true}

function dounbroadcast ()
 {broadcast = false;
  return true}

//------------------------------------------------------------------------------

function doreceive ()
 {reception = true;
  listen();
  return true}

function dounreceive ()
 {reception = false;
  return true}

//------------------------------------------------------------------------------

function doconnect ()
 {broadcast = true;
  reception = true;
  if (broadcast) {autosavedata(folder)};
  listen();
  return true}

function dodisconnect ()
 {broadcast = false;
  reception = false;
  return true}

//------------------------------------------------------------------------------

function listen ()
 {var newdata = false;
  if (reception) {newdata = autoloaddata(folder)};
  if (newdata) {populatesheet()};
  if (reception) {setTimeout(listen,1000)};
  return true}

//------------------------------------------------------------------------------
// saving and loading data
//------------------------------------------------------------------------------

function dosavedata ()
 {if (!checksave(folder))
     {savedata(folder); alert('Data saved.'); return true};
  if (confirm('Saving data may overwrite changes made by others.  Proceed?'))
     {savedata(folder); return true};
  return false}

function savedata (folder)
 {savedatasets(folder);
  savechannels(folder);
  return true}

function savedatasets (folder)
 {for (var dataset in datasets)
      {savedataset(folder,dataset)};
  return true}

function savedataset (folder,dataset)
 {var widget = document.getElementById(dataset);
  var source = widget.getAttribute('src');
  if (!source) {return false};
  if (!widget.changed) {return false};
  var nwt = putdata(folder,source,getdataset(dataset));
  widget.writetime = nwt;
  widget.changed = false;
  return true}

function savechannels (folder)
 {for (var channel in channels)
      {savechannel(folder,channel)};
  return true}

function savechannel (folder,channel)
 {var widget = document.getElementById(channel);
  var source = widget.getAttribute('src');
  if (!source) {return false};  
  if (widget.getAttribute('direction')!=='outbound') {return false};
  var data = channels[channel];
  if (data.length===0) {return false};
  putmessages(folder,source,data);
  channels[channel] = [];
  return true}

//------------------------------------------------------------------------------

function doloaddata ()
 {if (!checkload(folder))
     {loaddata(folder); alert('Data loaded.'); return true};
  if (confirm('Loading data may overwrite your recent changes.  Proceed?'))
     {loaddata(folder); return true};
  return false}

function loaddata (folder)
 {var flag = loadlambda(folder);
  flag = loaddatasets(folder) || flag;
  loadchannels(folder);
  populatesheet();
  return flag}

function loadlambda (folder)
 {var widget = document.getElementById('lambda');
  var source = widget.getAttribute('src');
  if (!source) {return false};
  var nwt = getfiletime(source);
  if (nwt===widget.writetime) {return false};
  widget.writetime = nwt;
  widget.changed = false;
  lambda = [];
  definefacts(lambda,getdata(folder,source));
  console.log('data loaded');
  return true}

function loaddatasets (folder)
 {var flag = false;
  for (var dataset in datasets)
      {flag = loaddataset(folder,dataset) || flag};
  return flag}

function loaddataset (folder,dataset)
 {var widget = document.getElementById(dataset);
  var source = widget.getAttribute('src');
  if (!source) {return false};
  var nwt = getwritetime(folder,source);
  if (nwt===widget.writetime) {return false};
  widget.writetime = nwt;
  widget.changed = false;
  var theory = seq();
  definefacts(theory,getdata(folder,source));
  datasets[dataset] = theory;
  return true}

function loadchannels (folder)
 {var flag = false;
  for (var channel in channels)
      {flag = loadchannel(folder,channel) || flag};
  return flag}

function loadchannel (folder,channel)
 {var widget = document.getElementById(channel);
  var source = widget.getAttribute('src');
  if (!source) {return false};  
  if (widget.getAttribute('direction')!=='inbound') {return false};
  var messages = getmessages(folder,source);
  for (i = 0; i<messages.length; i++)
      {enqueue(seq('message',messages[i],channel))};
  return true}

//------------------------------------------------------------------------------
// autosaving and autoloading data
// this is here for abhijeet called from mod routines and listen
// would be better if we could call plain savedata and loaddata
// if we keep, we should have autosavechannels and autoloadchannels as well
//------------------------------------------------------------------------------

function autosavedata (folder)
 {autosavelambda();
  autosavedatasets(folder);
  savechannels(folder);
  return true}

function autosavelambda ()
 {var widget = document.getElementById('lambda');
  var source = widget.getAttribute('src');
  if (!source) {return false};
  if (widget.getAttribute('broadcast')!=='true') {return false};
  if (!widget.changed) {return false};
  var nwt = putdata(folder,source,lambda);
  widget.writetime = nwt;
  widget.changed = false;
  console.log('data saved');
  return true}

function autosavedatasets (folder)
 {for (var dataset in datasets)
      {autosavedataset(folder,dataset)};
  return true}

function autosavedataset (folder,dataset)
 {var widget = document.getElementById(dataset);
  var source = widget.getAttribute('src');
  if (!source) {return false};
  if (widget.getAttribute('broadcast')!=='true') {return false};
  if (!widget.changed) {return false};
  var nwt = putdata(folder,source,getdataset(dataset));
  widget.writetime = nwt;
  widget.changed = false;
  return true}

//------------------------------------------------------------------------------

function autoloaddata (folder)
 {var flag = autoloadlambda(folder);
  flag = autoloaddatasets(folder) || flag;
  loadchannels(folder);
  populatesheet();
  return flag}

function autoloadlambda (folder)
 {var widget = document.getElementById('lambda');
  var source = widget.getAttribute('src');
  if (!source) {return false};
  if (widget.getAttribute('reception')!=='true') {return false};
  var nwt = getwritetime(folder,source);
  if (nwt===widget.writetime) {return false};
  widget.writetime = nwt;
  widget.changed = false;
  lambda = [];
  definefacts(lambda,getdata(folder,source));
  console.log('data loaded');
  return true}

function autoloaddatasets (folder)
 {var flag = false;
  for (var dataset in datasets)
      {flag = autoloaddataset(folder,dataset) || flag};
  return flag}

function autoloaddataset (folder,dataset)
 {var widget = document.getElementById(dataset);
  var source = widget.getAttribute('src');
  if (!source) {return false};
  if (widget.getAttribute('reception')!=='true') {return false};
  var nwt = getwritetime(folder,source);
  if (nwt===widget.writetime) {return false};
  widget.writetime = nwt;
  widget.changed = false;
  var theory = seq();
  definefacts(theory,getdata(folder,source));
  datasets[dataset] = theory;
  return true}

//------------------------------------------------------------------------------
// checking for updates
//------------------------------------------------------------------------------

function checksave (folder)
 {return checksavedatasets(folder)}

function checksavedatasets (folder)
 {for (var dataset in datasets)
      {if (checksavedataset(folder,dataset)) {return true}};
  return false}

function checksavedataset (folder,dataset)
 {var widget = document.getElementById(dataset);
  var source = widget.getAttribute('src');
  if (!source) {return false};
  var lwt = widget.writetime;
  var swt = getwritetime(folder,source);
  return (swt>lwt)}

//------------------------------------------------------------------------------

function checkload (folder)
 {return (checkloadlambda(folder) || checkloaddatasets(folder))}

function checkloadlambda ()
 {var widget = document.getElementById('lambda');
  var source = widget.getAttribute('src');
  if (!source) {return false};
  if (!widget.changed) {return false};
  return true}

function checkloaddatasets ()
 {for (var dataset in datasets)
      {if (checkloaddataset(dataset)) {return true}};
  return false}

function checkloaddataset (dataset)
 {var widget = document.getElementById(dataset);
  var source = widget.getAttribute('src');
  if (!source) {return false};
  if (!widget.changed) {return false};
  return true}

//------------------------------------------------------------------------------

function checklocal ()
 {return (checklocaldatasets() || checklocalchannels())}

function checklocallambda ()
 {var widget = document.getElementById('lambda');
  return widget.changed}

function checklocaldatasets ()
 {for (var dataset in datasets)
      {if (checklocaldataset(dataset)) {return true}};
  return false}

function checklocaldataset (dataset)
 {var widget = document.getElementById(dataset);
  return widget.changed}

function checklocalchannels ()
 {for (var channel in channels)
      {if (checklocaldataset(channel)) {return true}};
  return false}

function checklocalchannel (channel)
 {return channels[channel].length>0}

//------------------------------------------------------------------------------

function checkserver (folder)
 {return (checkserverdatasets(folder) || checkserverchannels(folder))}

function checkserverlambda (folder)
 {var widget = document.getElementById('lambda');
  var source = widget.getAttribute('src');
  if (!source) {return false};
  var lwt = widget.writetime;
  var swt = getwritetime(folder,source);
  return (swt>lwt)}

function checkserverdatasets (folder)
 {for (var dataset in datasets)
      {if (checkserverdataset(folder,dataset)) {return true}};
  return false}

function checkserverdataset (folder,dataset)
 {var widget = document.getElementById(dataset);
  var source = widget.getAttribute('src');
  if (!source) {return false};
  var lwt = widget.writetime;
  var swt = getwritetime(folder,source);
  return (swt>lwt)}

function checkserverchannels (folder)
 {for (var channel in channels)
      {if (checkserverchannel(folder,channel)) {return true}};
  return false}

function checkserverchannel (folder,channel)
 {var widget = document.getElementById(channel);
  var source = widget.getAttribute('src');
  if (!source) {return false};
  var lwt = widget.writetime;
  var swt = getwritetime(folder,source);
  return (swt>lwt)}

//------------------------------------------------------------------------------
// communication with server
//------------------------------------------------------------------------------

function dosavesheet ()
 {var sheet = getsheet();
  document.getElementById('lambda').textContent = grindem(lambda);
  var text = document.documentElement.outerHTML;
  var answer = posteval('/worksheets/homepage/save.php?sheet=' + sheet,text);
  alert('Sheet saved.');
  return true}

function dosaveback ()
 {var args = getarguments();
  document.getElementById('lambda').textContent = grindem(lambda);
  var text = document.documentElement.outerHTML;
  var answer = posteval('/worksheets/homepage/saveback.php?' + args,text);
  alert('Sheet saved.');
  return true}

function getrules (folder,ruleset)
 {var url = '/worksheets/homepage/loadruleset.php?folder=' + folder + '&ruleset=' + ruleset;
  return readdata(posteval(url,''))}

function makedataset (folder,dataset)
 {var url = '/worksheets/homepage/makedataset.php?folder=' + folder + '&dataset=' + dataset;
  return posteval(url,'')}

function dropdataset (folder,dataset)
 {var url = '/worksheets/homepage/dropdataset.php?folder=' + folder + '&dataset=' + dataset;
  return posteval(url,'')}

function getwritetime (folder,dataset)
 {var url = '/worksheets/homepage/getwritetime.php?folder=' + folder + '&dataset=' + dataset;
  return posteval(url,'')}

function getdata (folder,dataset)
 {var url = '/worksheets/homepage/loaddataset.php?folder=' + folder + '&dataset=' + dataset;
  return readdata(posteval(url,''))}

function putdata (folder,dataset,data)
 {var url = '/worksheets/homepage/savedataset.php?folder=' + folder + '&dataset=' + dataset;
  return posteval(url,grindem(data))}

function getmessages (folder,channel)
 {var url = '/worksheets/homepage/getmessages.php?folder=' + folder + '&channel=' + channel;
  return readdata(posteval(url,''))}

function putmessage (folder,channel,message)
 {var url = '/worksheets/homepage/putmessages.php';
  url += '?folder=' + folder;
  url += '&channel=' + channel;
  url += '&message=' + grind(message);
  return posteval(url,'')}

function putmessages (folder,channel,messages)
 {var url = '/worksheets/homepage/putmessages.php';
  url += '?folder=' + folder;
  url += '&channel=' + channel;
  url += '&message=' + grindem(messages);
  return posteval(url,'')}

function posteval (url,data)
 {request = new XMLHttpRequest();
  request.overrideMimeType('text/acl');
  request.open('POST',url,false);
  request.send(data);
  return request.responseText}

//------------------------------------------------------------------------------
// epilog changes
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
// Builtins
//------------------------------------------------------------------------------

builtins.push("worksheetuser");

function worksheetuser ()
 {if (user!=='') {return user};
  try {user = posteval('/worksheets/homepage/whoami.php','');}
      catch(e) {return 'anonymous';}
  return user}


builtins.push("parameter");

function parameter (attr)
 {var value = parameters[attr];
  if (value) {return value};
  return false}


builtins.push("worksheetfolder");

function worksheetfolder ()
 {return folder}


builtins.push("worksheet");

function worksheet ()
 {return sheet}


builtins.push("worksheetanchor");

function worksheetanchor ()
 {return anchor}


builtins.push("source");

function source (dataset)
 {var widget = document.getElementById(dataset);
  var source = widget.getAttribute('src');
  if (source) {return source};
  return false}


builtins.push("dayofweek");

function dayofweek (timestamp)
 {timestamp = numberize(timestamp);
  var d = new Date(timestamp);
  return stringize(d.getDay())}


builtins.push("timestamp");

function timestamp ()
 {return stringize(Date.now())}


builtins.push("totimestamp");

function totimestamp (date)
 {date = stripquotes(date);
  var d = new Date(date);
  return stringize(d.getTime())} 


builtins.push("formattimestamp");

function formattimestamp (timestamp)
 {timestamp = numberize(timestamp);
  var d = new Date(timestamp);
  var year = d.getFullYear(), month = d.getMonth(), day = d.getDate(), hour = d.getHours(), min = d.getMinutes(), sec = d.getSeconds();
  return seq('time',stringize(year),
                   stringize(month > 9? month: "0" + month),
                   stringize(day > 9? day: "0" + day),
                   stringize(hour > 9? hour: "0" + hour),
                   stringize(min > 9? min: "0" + min),
                   stringize(sec > 9? sec: "0" + sec))}

//------------------------------------------------------------------------------
// onresize
//------------------------------------------------------------------------------

window.onresize = function() {reposition()};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
