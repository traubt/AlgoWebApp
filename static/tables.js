// this is a table handler

function download_csv(csv, filename) {
    var csvFile;
    var downloadLink;

    // CSV FILE
    csvFile = new Blob([csv], {type: "text/csv"});

    // Download link
    downloadLink = document.createElement("a");

    // File name
    downloadLink.download = filename;

    // We have to create a link to the file
    downloadLink.href = window.URL.createObjectURL(csvFile);

    // Make sure that the link is not displayed
    downloadLink.style.display = "none";

    // Add the link to your DOM
    document.body.appendChild(downloadLink);

    // Lanzamos
    downloadLink.click();
}

function export_table_to_csv(table_div, filename) {
	var csv = [];
	var rows = document.querySelectorAll(table_div + " table tr");
	
    for (var i = 0; i < rows.length; i++) {
		var row = [], cols = rows[i].querySelectorAll(table_div + " td, th");
		
        for (var j = 0; j < cols.length; j++) 
            row.push('"' + cols[j].innerText + '"');
        
		csv.push(row.join(","));		
	}

    // Download CSV
    download_csv(csv.join("\n"), filename);
}

function makeTable(container, data, header) {
    var table = $("<table/>");
     container.append(table);

    // First create your thead section
    $(table).append('<thead><tr></tr></thead>');

    // Then create your head elements
	var $thead = $(container[0]).find('tr:first')

    for (var i = 0, len = header.length; i < len; i++) {
        $thead.append('<th>'+header[i]+'</th>');
    };

    // add body
    $(container[0]).find('table').append('<tbody></tbody>')

    // create records
    $.each(data, function(rowIndex, r) {
        var row = $("<tr/>");
        $.each(r, function(colIndex, c) {
            row.append($("<td/>").text( round_to(c,4)||c));
        });
//        table.append(row);
        $(container[0]).find('tbody').append(row)
    });
	// adding table summary for stock distribution
	
	if(container[0].id == "weightsTB"){
		
		var tfoot = "<tfoot><tr><th>Average Return (p/m):</th><th></th><th></th><th></th></tr><tr><th>Risk:</th><th></th><th></th><th></th></tr><tr><th>Efficiency:</th><th></th><th></th><th></th></tr></tfoot>"
		
		table.append(tfoot);
	}

        var r = '<br><button id="save_portfolio" type="button" class="btn btn-info">Download CSV<span class="glyphicon glyphicon-save" aria-hidden="true"></span></button>';
        container.append(r);
		
			//download to CSV
	$("#save_portfolio").on('click', function(event){
		alert("start download");
		var table_div = "#" + $(this).parent().attr("id");
		
		switch(table_div){
        case "#monthlyTB":
		case "#returnTB":
		case "#correlationTB":
		case "#covarianceTB":
		case "#weightsTB":
		case "#indicatorsTB":
		case "#monteTB":
			export_table_to_csv(table_div,"data.csv");
            break;
		case "#dailyTB":
		case "#daily_returnTB":
		case "#trackTB":
		case "#rxTB":
            download_array_2_csv(data) ;
            break;
		}

	});
  
}

function appendTableColumn(table, rowData) {
  var lastRow = $('<tr/>').appendTo(table.find('tbody:last'));
  $.each(rowData, function(colIndex, c) { 
      lastRow.append($('<td/>').text(round_to(c,4)||c + "%"));
  });
   
  return lastRow;
}
 
// $(document).ready(function() {
//     var table = makeTable(data);
//     appendTableColumn(table, ["Calgary", "Ottawa", "Yellowknife"]);
// });

function getTableData(table) {
    var data = [];
    table.find('tr').each(function (rowIndex, r) {
        var cols = [];
        $(this).find('th,td').each(function (colIndex, c) {
            cols.push(c.textContent);
        });
        data.push(cols);
    });
    return data;
}



function create_table(type) {  
   

    var date_range =   [];
    var header   = [];
    data = [];

    
    switch(type){
		
		case "_history_d":
			//combine_prices();
            header = portfolio._ticker_list.map(function(el){return el});
            header.unshift("Date");
            data = combine_price._data
            //data.unshift(date_range);
            data = jStat.transpose(data);
            makeTable($("#dailyTB"), data, header); 
            tb_day = $("#dailyTB table").DataTable({
				//"paging":   false,
                //"info":     false,
                //"searching": false,
//				"responsive": true,
//				"scrollX": true,
//				"scrollY":        "600px",
//				"scrollCollapse": true
			}); 
            //data.unshift(header);
		break;

        case "_history_m":
            date_range = portfolio._date_ragne_arr.map(function(el){return el});;
            header = portfolio._ticker_list.map(function(el){return el});;
            header.unshift("Date");
            data = portfolio.info.map(function(obj){return obj}).map(function(el){return el.range_vector_arr});
            data.unshift(date_range);
            data = jStat.transpose(data);

            makeTable($("#monthlyTB"), data, header); 
            tb_mon = $("#monthlyTB table").DataTable({
				"paging":   false,
                "info":     false,
                "searching": false,
				"responsive": true,
				"scrollX": true,
				"scrollY":        "500px",
				"scrollCollapse": true
			}); 
            
            data.unshift(header);
           // download_array_2_csv(data);
            break;
		
		case "_daily_returns":
			//combine_prices();
            header = portfolio._ticker_list.map(function(el){return el});
            header.unshift("Date");
            data = combine_return._data
            //data.unshift(date_range);
            data = jStat.transpose(data);
			//console.log(data);
			makeTable($("#daily_returnTB"), data, header); 
			tb_Dret = $("#daily_returnTB table").DataTable({
				"responsive": true,
				"scrollX": true,
				"scrollY":        "600px",
				"scrollCollapse": true
			}); 
			data.unshift(header);
		break;
        
        case "_returns":
			data=[];
            date_range = portfolio._date_ragne_arr;
            date_range.shift();
            header = portfolio._ticker_list.map(function(el){return el});
            header.unshift("Date");
            //data = portfolio._returns._data.map(function(el){return el});
			data=initialize_two_dim_array(portfolio._returns._data.length,portfolio._returns._data[0].length);
			$.each(portfolio._returns._data,function(idx,range){$.each(range,function(col,el){data._data[idx][col] = p(el)})});
            data._data.unshift(date_range);
            data._data = jStat.transpose(data._data);
            //console.log(data);
            makeTable($("#returnTB"), data._data, header); 
            tb_ret = $("#returnTB table").DataTable({
				"paging":   false,
                "info":     false,
                "searching": false,
				"responsive": true,
				"scrollX": true,
				"scrollY":        "500px",
				"scrollCollapse": true
			}); 
            data._data.unshift(header);
            break;
            
        case "_correlation":
            header = portfolio._ticker_list.map(function(el){return el});
            header.unshift("Symbol");
           // data = portfolio._correlation._data;
			data = get_corralation_table();
            data = jStat.transpose(data);
            data.unshift(portfolio._ticker_list);
            data = jStat.transpose(data);
            makeTable($("#correlationTB"), data, header); 
			$('#correlationTB table tr td').off('click');
            tb_cor = $("#correlationTB table").DataTable({
                "paging":   false,
                "ordering": false,
                "info":     false,
                "searching": false,
				"scrollX": true
            });
            data.unshift(header);
	$('#correlationTB table tr td').on('click',function(){

	var s1, s2;
	var $div = $('<div></div>');
	var arr = [];
	var colIndex = $(this).parent().children().index($(this));
	var rowIndex = $(this).parent().parent().children().index($(this).parent());
	var id = $(this).attr('style');
		if (id){
			s1 = portfolio.info[colIndex-1];
			s2 = portfolio.info[rowIndex];
			arr = corralation_arr(s1,s2);			
			$div.append(get_corralation_text($(this).attr("style"))  + ' between ' + s1.current_quote["quoteSummary.result.0.price.longName"] + '<br>and:<br>' + s2.current_quote["quoteSummary.result.0.price.longName"] +'. <br><br>Comparing the two assests:<br><br>');
			$div2 = $('<div id="c1"></div>');
			inject_table(arr._data,$div2);
			$div.append($div2);			
			dialog("Correlation Info: Compare Assets",$div,BootstrapDialog.TYPE_INFO);			
		}
	});			
            break;
            
        case "_covariance":
            header = portfolio._ticker_list.map(function(el){return el});
            header.unshift("Symbol");
            data = portfolio._covariance._data;
            data = jStat.transpose(data);
            data.unshift(portfolio._ticker_list);
            data = jStat.transpose(data);
            makeTable($("#covarianceTB"), data, header); 
            tb_cov = $("#covarianceTB table").DataTable({
                "paging":   false,
                "ordering": false,
                "info":     false,
                "searching": false,
				"scrollX": true
            });
            data.unshift(header);
            break;
            
        case "_stock_indicators":  
            header = indicator_arr;
			header.unshift("Symbol");
            data = portfolio_indicator._data.map(function(el){return el});
            makeTable($("#indicatorsTB"), data, header); 
            tb_ind = $("#indicatorsTB table").DataTable({
                "paging":   false,
                "info":     false,
                "searching": false,
				"scrollX": true
            });
            data.unshift(header);
            break;
			
        case "_weight_optim":  
			header = ["Symbol","Current Weights","Equal Weights","Optimized Weights","Buy/Sell"];
            //data = weight_arr;
			data = weight_arr._data.map(function(el){return el});
			//data = jStat.transpose(data);
            makeTable($("#weightsTB"), data, header); 
            tb_wgt = $("#weightsTB table").DataTable({
                "paging":   false,
                "info":     false,
                "searching": false,
                "sort":false
            });
            data.unshift(header);
            break;	
			
//symbol , endurance, fluctiuation, current price, max, min
        case "_monte_carlo":  
			header = ["Symbol","Days Back","fluctuation","Strike Price", "Strike Date", "Max Predicted Price","Min Predicted Price", "Recent Price", "Recent Price Date" ,"Sell?"];
            //data = weight_arr;
			data = monte_carlo_arr._data.map(function(el){return el});
			//data = jStat.transpose(data);
            makeTable($("#monteTB"), data, header); 
            tb_mcarlo = $("#monteTB table").DataTable({
                "paging":   false,
                "info":     false,
                "searching": false
            });
            data.unshift(header);
            break;			
            
		case "_daily_tracking": 
			//combine_prices();
            header = ["Date","Total Portfolio", "Change from Last Trade", " Change in %"];
            //header.unshift("Date");
            data = daily_track._data;
            //data.unshift(date_range);
            //data = jStat.transpose(data);
            makeTable($("#trackTB"), data, header); 
            tb_trk = $("#trackTB table").DataTable({
				"paging":   true,
                "info":     true,
                "searching": false,
				"responsive": true,
				//"scrollX": true,
				"scrollY":        "500px",
				"scrollCollapse": true
			}); 
            //data.unshift(header);
			symbol_data2("portfolio","trackChart");
		break;
		
		case "_rate_exchange":
            header = ["Date","Close", "High", "Low","Volume","Open"];
            data = two_dim_arr;
            makeTable($("#rxTB"), data, header); 
            tb_rx = $("#rxTB table").DataTable({
				"paging":   true,
                "info":     true,
                "searching": false,
				"responsive": true,
				//"scrollX": true,
				"scrollY":        "500px",
				"scrollCollapse": true
			});
		break;		
            
    }

}

function download_array_2_csv(data){
    
    var csvContent = "data:text/csv;charset=utf-8,";

    data.forEach(function(infoArray, index){
       dataString = '"' + infoArray.join(",") + '"' ;   
       csvContent += index < data.length ? dataString+ "\n" : dataString;

    }); 

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data.csv");
    document.body.appendChild(link); // Required for FF

    link.click();


}

function inject_table(array, container){
	
	    //Build an array containing Customer records.
       // array.push(["Customer Id", "Name", "Country"]);
       // array.push([1, "John Hammond", "United States"]);
       // array.push([2, "Mudassar Khan", "India"]);
       // array.push([3, "Suzanne Mathews", "France"]);
       // array.push([4, "Robert Schidner", "Russia"]);
	
       //Create a HTML Table element.
        var table = $("<table />");
        table[0].border = "1";
 
        //Get the count of columns.
        var columnCount = array[0].length;
 
        //Add the header row.
        var row = $(table[0].insertRow(-1));
        for (var i = 0; i < columnCount; i++) {
            var headerCell = $("<th />");
            headerCell.html(array[0][i]);
            row.append(headerCell);
        }
 
        //Add the data rows.
        for (var i = 1; i < array.length; i++) {
            row = $(table[0].insertRow(-1));
            for (var j = 0; j < columnCount; j++) {
                var cell = $("<td />");
                cell.html(array[i][j]);
                row.append(cell);
            }
        }
 
        var dvTable = $(container);
        dvTable.html("");
        dvTable.append(table);	

		//$( container +" tr:last" ).css({ backgroundColor: "yellow", fontWeight: "bolder" });
}

function corralation_arr(s1,s2){
	
	var arr = [];

	  arr = initialize_two_dim_array(3,4);
	  arr._data[0][0] = "Company";
	  arr._data[0][1] = "Growth";
	  arr._data[0][2] = "Risk";
	  arr._data[0][3] = "Efficiency";
// populate symbols
	  arr._data[1][0] = s1.current_quote["quoteSummary.result.0.price.longName"];
	  arr._data[1][1] = p(s1.growth_mean);
	  arr._data[1][2] = p(s1.growth_std);
	  arr._data[1][3] = n(s1.s_ratio);  
	  arr._data[2][0] = s2.current_quote["quoteSummary.result.0.price.longName"];
	  arr._data[2][1] = p(s2.growth_mean);
	  arr._data[2][2] = p(s2.growth_std);
	  arr._data[2][3] = n(s2.s_ratio);  

	
	return arr;
}




	


