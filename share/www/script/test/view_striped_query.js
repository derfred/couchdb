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

couchTests.view_striped_query = function(debug) {
  var db = new CouchDB("test_suite_db");
  db.deleteDb();
  db.createDb();
  if (debug) debugger;

  var docs = makeDocs(0, 100);
  T(db.bulkSave(docs).ok);

  var designDoc = {
    _id:"_design/test",
    language: "javascript",
    views: {
      all_docs: {
        map: "function(doc) { emit(doc.integer, doc.string) }"
      },
      sum: {
        map:"function (doc) {emit(doc.integer, doc.integer)};",
        reduce:"function (keys, values) { return sum(values); };"
      },
      sum_from_array: {
        map:"function (doc) {emit([doc.integer, doc.integer + 2], doc.integer)};",
        reduce:"function (keys, values) { return sum(values); };"
      }
    }
  }
  T(db.save(designDoc).ok);

  // First the baseline, check that striped results can be extracted from a map view
  // here we are getting [10..20, 30..40, 55..60] as a single array ie. not nested
  var rows = db.view("test/all_docs",{},{stripes: [{startkey: 10, endkey: 20}, {startkey: 30, endkey: 40}, {startkey: 55, endkey: 60}]}).rows;
  var expected = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19,   20, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,   55, 56, 57, 58, 59, 60];
  T(rows.length == expected.length);
  for(i = 0;rows[i];i++) {
    T(rows[i].value == expected[i]);
  }
  
  // Next check that non-existant keys are ignored
  var rows = db.view("test/all_docs",{},{stripes: [{startkey: 10, endkey: 15}, {startkey: 98, endkey: 120}]}).rows;
  var expected = [10, 11, 12, 13, 14, 15,   98, 99];
  T(rows.length == expected.length);
  for(i = 0;rows[i];i++) {
    T(rows[i].value == expected[i]);
  }

  // Now see if this works with a view including a reduce, the following should do a reduce over the two stripes
  var result = db.view("test/sum",{},{stripes: [{startkey: 10, endkey: 15}, {startkey: 25, endkey: 30}]});
  T(result.rows[0].value == (10+11+12+13+14+15 + 25+26+27+28+29+30));

  // And also check that non-existant keys are ignored in a reduce
  var result = db.view("test/sum",{},{stripes: [{startkey: 10, endkey: 15}, {startkey: 98, endkey: 120}]});
  T(result.rows[0].value == (10+11+12+13+14+15 + 98+99));

  // check this works with complex keys
  var result = db.view("test/sum_from_array",{},{stripes: [{startkey: [10], endkey: [15]}, {startkey: [98], endkey: [120]}]});
  T(result.rows[0].value == (10+11+12+13+14 + 98+99));

  // it should handle flipped order for the stripe keys
  var result = db.view("test/sum",{},{stripes: [{endkey: 15, startkey: 10}, {endkey: 120, startkey: 98}]});
  T(result.rows[0].value == (10+11+12+13+14+15 + 98+99));
};
