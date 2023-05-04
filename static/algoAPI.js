async function fetch_api(url){
    let myHeaders = new Headers();
//    let url = 'https://www.ig.com/za/ig-proxy/marketscreener/filter?MKTCAP=[3000000000,)&PR13WKPCT=[3,)&PR26WKPCT=[2,)&PR52WKPCT=[2,)&country=US&sortField=name&sortDirection=ASC&page_number=1&page_size=450'
    myHeaders.append('Content-Type', 'application/json');
    fetch(url, {
    method: 'GET',
    headers: {
        'Origin': url
    }
    })
 .then(response => response.json())
//  socket.emit(user, {data: JSON.stringify(_template_pressure)});
 .then(data => console.log(JSON.stringify(data))
}