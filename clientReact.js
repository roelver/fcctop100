
/*
 * The page header
 */
class Header extends React.Component {
  render() {
    return (
      <header>
        <a href="http://www.freecodecamp.com">
          <img className="fcclogo" src="https://s3.amazonaws.com/freecodecamp/freecodecamp_logo.svg" alt="FreeCodeCamp logo" />
        </a>
      </header>
    );
  }
}

/*
 * The page footer
 */
class Footer extends React.Component {
  render() {
    return (
      <footer>
        <div className="container">
          <p>*** By <a href="http://www.freecodecamp.com/roelver">@roelver</a> ***</p>
        </div>
      </footer>
    );
  }
}

/*
 *  Component for column headers including basic sort mechanism 
 */
class ColumnHeadings extends React.Component {
  render() {
    var all = (this.props.modus === "alltime");
    return (
      <thead>
      <tr id="colheaders" className="top100">
        <th className="idcol">#</th>
        <th onClick={this.handleClickStr.bind(this,"username")}>Camper Name</th> 
        <th id="defaultsort" className="sorted true" onClick={this.handleClickNum.bind(this, (all ? "total" : "totalRecent"))}>{all ? "All time score" : "Recent score"}</th>
        <th onClick={this.handleClickNum.bind(this, (all ? "points" : "pointsRecent"))}>Points</th>
        <th onClick={this.handleClickNum.bind(this, (all ? "basejumps" : "basejumpsRecent"))}>Basejumps (x60)</th>
        <th onClick={this.handleClickNum.bind(this, (all ? "ziplines" : "ziplinesRecent"))}>Ziplines (x30)</th>
        <th onClick={this.handleClickNum.bind(this, (all ? "bonfires" : "bonfiresRecent"))}>Bonfires (x3)</th>
        <th onClick={this.handleClickNum.bind(this, (all ? "totalRecent" : "total"))}>{ all ? "Recent score" : "All-time score"}</th>
        <th className="lastchecked">Last update</th>
        <th className="buttons"></th>
      </tr>
      </thead>
    );
  }
  removeSortClasses() {
    var nodes = document.getElementById('colheaders').childNodes;
    for (var i=0; i < nodes.length; i++) {
      nodes.item(i).className = "";
    };
  }
  handleClickStr(fieldname, evt) {
    var reverse = !this.props.reverse;
    if (evt.target.classList.contains('sorted')) {
      evt.target.className = "sorted "+ reverse;
      this.props.sortTableStr(fieldname, reverse);    
    }
    else {
      this.removeSortClasses();
      evt.target.className = 'sorted true';
      this.props.sortTableStr(fieldname, true);    
    }
  } 
  handleClickNum(fieldname, evt) {
    var reverse = !this.props.reverse;
    if (evt.target.classList.contains('sorted')) {
      evt.target.className = "sorted "+ reverse;
      this.props.sortTableNum(fieldname, reverse);    
    }
    else {
      this.removeSortClasses();
      evt.target.className = 'sorted true';
      this.props.sortTableNum(fieldname, true);    
    }
  } 
}

/*
 *  Component represents a user row in the table and a handler for user updates
 */
class User extends React.Component {
  render() {
    var showDate = moment(this.props.user.lastUpdate).format("YYYY-MM-DD HH:mm:ss");
    var all = (this.props.modus === "alltime");
    return (
      <tr className="top100">
        <td className="idcol">{this.props.count}</td>
        <td>
          <a href={"http://www.freecodecamp.com/"+this.props.user.username} target="_blank">
            <img src={this.props.user.img} className="userimg"/>
            <span>{this.props.user.username}</span>
          </a>
        </td>
        <td className="numbercol">{all ? this.props.user.total : this.props.user.totalRecent}</td>
        <td className="numbercol">{all ? this.props.user.points : this.props.user.pointsRecent}</td>
        <td className="numbercol">{all ? this.props.user.basejumps : this.props.user.basejumpsRecent}</td>
        <td className="numbercol">{all ? this.props.user.ziplines : this.props.user.ziplinesRecent}</td>
        <td className="numbercol">{all ? this.props.user.bonfires : this.props.user.bonfiresRecent}</td>
        <td className="numbercol">{all ? this.props.user.totalRecent : this.props.user.total}</td>
        <td className="lastchecked">{showDate}</td>
        <td className="buttons">
          <button className="btn btn-default" onClick={this.handleClickUpdateUser.bind(this)}>
            <i className="glyphicon glyphicon-refresh"></i>
          </button>
        </td>
      </tr>
    );
  }
  handleClickUpdateUser() {
    $.get( this.props.apiroot+"update/"+this.props.user.username, 
          function( data ) {
            setTimeout(this.props.updatePage,2000);
          }.bind(this)
        )
    .fail(function() {
        console.error(this.props.apiroot, status, err.toString());
  });
  }
}

/*
 *  Component for  
 */
class Leaderboard extends React.Component {
  render() {
      var count = 0;
      var self = this;
      var userlist = this.props.users.map(function(user) {
         count++;
         return (count <= 100 ?
           <User user={user} key={user.username} count={count} apiroot={this.props.apiroot} modus={this.props.modus} updatePage={this.props.updatePage}/> : null
         );
      }.bind(this));

    return (
       <table className="table table-striped table-bordered">
          <ColumnHeadings modus={this.props.modus} reverse={this.props.reverse} 
 sortTableNum={this.props.sortTableNum} sortTableStr={this.props.sortTableStr}/>
          <tbody>
            {userlist}
          </tbody>
      </table>
    );
  }
}

/* 
 * The page body, with state and status handlers for switching the mode (recent/all time) 
 * and handlers for sorting 
 */
class Body extends React.Component {
  constructor() {
    super();
    this.state = { 
      users: [],
      modus: "recent",
      reverse: true,
      column: "totalRecent"
    }
  }
  getData() {
    $.ajax({
      url: this.props.apiroot+this.state.modus,
      dataType: 'json',
      cache: false,
      success: function(data) {
        var users = data.map(function(user) {
               user.totalRecent = (user.basejumpsRecent * 60) + (user.ziplinesRecent * 30) + (user.bonfiresRecent * 3) + user.pointsRecent;
               user.total = (user.basejumps * 60) + (user.ziplines * 30) + (user.bonfires * 3) + user.points;
               return user;
            });
        this.setState({users: users});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.apiroot, status, err.toString());
      }.bind(this)
    });
  }
  componentDidMount() {
    this.getData();
  }
  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div id="header">
              <h3>{ this.state.modus === "recent" ? "Leaderboard over past 30 days" : "All time leaderboard"}</h3>
              <a href="#" className="switchbutton" onClick={this.switchModus.bind(this)}>{this.state.modus === "recent" ? "Show All-time" : "Show Recent"}</a>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-12">
              <Leaderboard 
                users={this.state.users} 
                modus={this.state.modus} 
                reverse={this.state.reverse} 
                apiroot={this.props.apiroot} 
                updatePage={this.getData.bind(this)} 
                sortTableNum={this.sortTableNum.bind(this)} 
                sortTableStr={this.sortTableStr.bind(this)}
                />
           </div>
        </div>
      </div>
    );
  }
  removeSortClasses() {
    var nodes = document.getElementById('colheaders').childNodes;
    for (var i=0; i < nodes.length; i++) {
      nodes.item(i).className = "";
    };
  }
  switchModus() {
    if (this.state.modus === "recent") {
      this.setState({modus: "alltime", reverse: true, column: "total"},  this.getData);
    }
    else {
      this.setState({modus: "recent", reverse: true, column: "totalRecent"}, this.getData);
    }
    this.removeSortClasses();
    var head = document.getElementById('defaultsort');
    head.className = "sorted true";
  }
  sortTableNum(column, newReverse) {
     var users = this.state.users;
     users.sort(function(a,b) {
       return a[column] - b[column];
     } ) ;
     if (newReverse) {
       users.reverse();
     }
     this.setState({users: users, reverse: newReverse, column: column});
   }
  sortTableStr(column, newReverse) {
     var users = this.state.users;
     users.sort(function(a,b) {
       if (a[column].toLowerCase() < b[column].toLowerCase()) return -1;
       return 1;
     } );
     if (newReverse) {
       users.reverse();
     }
     this.setState({users: users, reverse: newReverse, column: column});
  }
}
  
/*
 * The application level component
 */
class Application extends React.Component {
  render() {
    return <div>
      <Header />
      <Body apiroot={this.props.apiroot} />
      <Footer />
    </div>;
  }
}

/* 
 * Put it all into the HTML
 */
ReactDOM.render(<Application  apiroot="http://fcctop100.herokuapp.com/api/fccusers/"/>, document.getElementById('fcctop'));
