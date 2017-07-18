var request = require('request');
var cheerio = require('cheerio');
var bibparser = require('bibtex-parser-js');

var app = angular.module('citations', []);

app.controller("mainController", function($scope, $timeout, $http){
    var inputBib = "";
    $scope.i = 0;

    //////////
    function handleFileSelect(evt) {
        var files = evt.target.files; // FileList object

        var reader = new FileReader();
        
        reader.onloadend = function () {
            //console.log(reader.result);
            inputBib = reader.result;
        }

        reader.readAsBinaryString(files[0]);
    }

    document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
    ////////

    $scope.retriveResults = function(){
        $scope.citationCount = "Loading..."
        var bib = "";

        if($scope.i % 2){
            $http.get($scope.urlInput)
            .then(function(response){
                if (response.status != 200){
                    // error occured
                    alert("There is an issue with the url you entered!");
                    return;
                }

                // then no issue, process
                bib = bibparser.toJSON(response.data)[0];
                processResults(bib);
            });

        }else{
            if (inputBib.length == 0){
                alert("Please put a bib file!");
                return;
            }

            bib = bibparser.toJSON(inputBib)[0];
            processResults(bib);
        }
        
    }

    function processResults(bib){
        console.log("Author : " + bib.entryTags.AUTHOR);
        console.log("Title : " + bib.entryTags.TITLE);

        document.getElementById('fileInput');
        url = "https://scholar.google.com.sg/scholar?hl=en&q=" + encodeURIComponent(bib.entryTags.TITLE) +"+" + encodeURIComponent(bib.entryTags.AUTHOR);

        console.log("URL : " + url);

        request(url, function(err, respose, html){
             var found = false;

             var $ = cheerio.load(html);

             $('.gs_fl').filter(function(i){

                 var text = $(this).children().first().text().toString();

                 if (i==1){
                     found = true;
                     if (text.indexOf("Cited by") != -1){
                        $scope.citationCount = text;

                        // since asynchronous
                        $scope.$apply();
                    }else{
                        // no citations
                        $scope.citationCount = "Cited by 0";
                        $scope.$apply();
                    }
                 }

            }
            );

            // check afeter 6 seconds whether found
            $timeout(function(){
                if (!found){
                    $scope.citationCount = "No record found on google scholar";
                    $scope.$apply();
                }
            }, 6000);            
         });
    }


    $scope.toggleInput = function(){
        $scope.i++;
        $scope.i %= 2;
    }
});