// client-side validation by fileUpload should match the policy
// restrictions so that the checks fail early
var acceptFileType = /.*/i;
var maxFileSize = 10000000;
// The URL to your endpoint that maps to s3Credentials function
var credentialsUrl = '/s3_credentials';
var categoriesUrl = '/category_names';
var addToDbUrl = '/add_item';

// The URL to your endpoint to register the uploaded file
let uploadUrl = '/assets';


$.ajax({
    url: categoriesUrl,
    type: 'GET',
    dataType: 'json',
    success: (titles) => {
        $.each(titles, function(key, value) {
            $('#category')
                .append($("<option></option>")
                    .attr("value",value)
                    .text(value));
        });
    }
});

const addToDB = function (filename) {
    const category = $('#category').val();
    const displayOrder = $('#displayOrder').val();
    const keywords = $('#keywords').val();
    const homepage = $('#displayHomepage').is(":checked");
    const title = $('#title').val();
    const description = $('#description').val();

    $.ajax({
        url: addToDbUrl,
        type: 'GET',
        dataType: 'json',
        data: {
            title,
            description,
            category,
            displayOrder,
            keywords: keywords.split(/[,\s]+/),
            path: filename,
            homepage
        },
        success: (res) => {
            console.log('woo', res);
        }
    });
};

window.initS3FileUpload = function($fileInput) {
    $fileInput.fileupload({
        // acceptFileTypes: acceptFileType,
        maxFileSize: maxFileSize,
        paramName: 'file',
        add: s3add,
        dataType: 'xml',
        done: onS3Done
    });
};

// This function retrieves s3 parameters from our server API and appends them
// to the upload form.
function s3add(e, data) {
    var filename = data.files[0].name;
    var contentType = data.files[0].type;
    var params = [];
    $.ajax({
        url: credentialsUrl,
        type: 'GET',
        dataType: 'json',
        data: {
            filename: filename,
            content_type: contentType
        },
        success: function(s3Data) {
            data.url = `${s3Data.endpoint_url}`;
            data.formData = s3Data.params;
            data.submit();
        }
    });
    return params;
}

function onS3Done(e, data) {
    var s3Url = $(data.jqXHR.responseXML).find('Location').text();
    var s3Key = $(data.jqXHR.responseXML).find('Key').text();

    // Typically, after uploading a file to S3, you want to register that file with
    // your backend. Remember that we did not persist anything before the upload.
    console.log($('<a class="success" />').attr('href', s3Url).text('Success! File uploaded at '+ s3Url).appendTo($('#user-form')));
    addToDB(s3Key);
}
