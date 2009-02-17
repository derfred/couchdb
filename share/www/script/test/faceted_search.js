// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License.  You may obtain a copy
// of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
// License for the specific language governing permissions and limitations under
// the License.

couchTests.faceted_search = function(debug) {
  var db = new CouchDB("test_suite_db33");
  db.deleteDb();
  db.createDb();
  if (debug) debugger;


  // create a few sample docs
  T(db.save({zone:"a",size:400,name:"obj1"}).ok);
  T(db.save({zone:"b",size:100,name:"obj2"}).ok);
  T(db.save({zone:"b",size:300,name:"obj3"}).ok);
  T(db.save({zone:"c",size:600,name:"obj4"}).ok);

  var designDoc = {
    _id:"_design/test",
    language: "javascript",
    views: {
      all_docs: {
        map: "function(doc) { emit([doc.zone, doc.size], doc.name) }"
      }
    }
  }
  T(db.save(designDoc).ok);


  // get me everything with a zone between a and b and a size between 200 and 500
  var rows = db.view("test/all_docs",{},{stripes: [{startkey: ["a", 200], endkey: ["a", 500]}, {startkey: ["b", 200], endkey: ["b", 500]}]}).rows;
  T(rows.length == 2);
  T(rows[0].value == "obj1");
  T(rows[1].value == "obj3");
};
