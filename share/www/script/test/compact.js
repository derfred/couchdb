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

couchTests.compact = function(debug) {
  var db = new CouchDB("test_suite_db");
  db.deleteDb();
  db.createDb();
  if (debug) debugger;
  var docs = makeDocs(0, 10);
  var saveResult = db.bulkSave(docs);
  T(saveResult.ok);

  var binAttDoc = {
    _id: "bin_doc",
    _attachments:{
      "foo.txt": {
        content_type:"text/plain",
        data: "VGhpcyBpcyBhIGJhc2U2NCBlbmNvZGVkIHRleHQ="
      }
    }
  }

  T(db.save(binAttDoc).ok);

  var originalsize = db.info().disk_size;

  for(var i in docs) {
      db.deleteDoc(docs[i]);
  }
  db.setAdmins(["Foo bar"]);
  var deletesize = db.info().disk_size;
  T(deletesize > originalsize);

  var xhr = CouchDB.request("POST", "/test_suite_db/_compact");
  T(xhr.status == 202);
  // compaction isn't instantaneous, loop until done
  while (db.info().compact_running) {};
  
  T(db.ensureFullCommit().ok);
  restartServer();
  var xhr = CouchDB.request("GET", "/test_suite_db/bin_doc/foo.txt");
  T(xhr.responseText == "This is a base64 encoded text")
  T(xhr.getResponseHeader("Content-Type") == "text/plain")
  T(db.info().doc_count == 1);
  T(db.info().disk_size < deletesize);
  
};