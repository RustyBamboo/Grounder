var app = angular.module("Grounder", ["ngRoute"])
app.config(function($routeProvider) {
  $routeProvider
  .when("/", {
      templateUrl: "/html/home.html"
  })
  .when("/img:img*", {
      templateUrl: "/html/img.html",
      controller: "imgCtrl"
  })
  .when("/img", { redirectTo: "/img/" })
  .when("/dir/:dir*/", {
      templateUrl: "/html/dir.html",
      controller: "dirCtrl"
  })
  .when("/dir/", {
      templateUrl: "/html/dir.html",
      controller: "dirCtrl"
  })
  .when("/template:template*", {
      templateUrl: "/html/template.html",
      controller: "templateCtrl"
  })
  .when("/template", {redirectTo: "/template/"})
  .otherwise({
      templateUrl: "/html/404.html"
  });
});

app.controller("imgCtrl", function($scope, $routeParams, $http) {
    $scope.img = $routeParams.img;
    function split_dir_img(str)
    {
        var split = str.split('/')
        var ret = '/'
        for(var i = 1; i < split.length - 1; i++)
        {
            ret += split[i] + '/'
        }
        return ret
    }
    $scope.dir = split_dir_img($scope.img)
    $scope.img_url = "/api/img" + $scope.img
    $scope.old_label = {}
    $scope.label = {}

    $http.get("/api/label" + $scope.img).then(
    function success(res) {
        $scope.old_label = res.data
        $scope.label = $scope.old_label
    },
    function error(res) {
        console.warn('could not get label', res.status, res.data)
    })

    $scope.save = function() {
        $http.post("/api/label" + $scope.img, $scope.label).then(
        function success(res) {
            console.log("Saved");
        },
        function error(res) {
            console.warn("could not save label", res.status, res.data)
        })
    }

    $scope.reset = function () {
        $scope.label = $scope.old_label
    }

    
    var currentShape = 0;
    var shapes = new Array();
    shapes.push(new Shape());
    var paint;
    var context;

    function prepare() {
        canvas = document.getElementById('canvas')
        context = canvas.getContext("2d");

        $('#canvas').each(function() {
            var design = $(this).attr('image');
            var img1 = new Image();
            img1.onload = function() {
                context.drawImage(this, 0, 0);
            };
            img1.src = design;
        });

        $('#canvas').mousedown(function(e) {
            var mouseX = e.pageX - this.offsetLeft;
            var mouseY = e.pageY - this.offsetTop;

            paint = true;
            addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
            redraw();
        });

        // TODO: Regular drawing
        $('#canvas').mousemove(function(e) {
            if (paint) {
            }
        });

        $('#canvas').mouseup(function(e) {
            paint = false;
        });

        $('#canvas').mouseleave(function(e) {
            paint = false;
        });
    }

    function Label() {
      this.name = "";
    }

    function Point(x, y) {
      this.x = x;
      this.y = y;
    }

    function Shape() {
      this.points = new Array();
      this.label = new Label();
    }

    // var points = new Array();
    var currentShape = 0;
    var shapes = new Array();
    shapes.push(new Shape());
    var paint;

    // var $div = $("<input>", {type: "text", "id": "txt_name"});

    function addClick(x, y, dragging) {
        shapes[currentShape].points.push(new Point(x,y));
    }

    function redraw() {
      var points = shapes[currentShape].points;

      // Check if we are closing the contour
        var done_drawing = false;
        if (points.length > 1 && nearby(points[points.length - 1], points[0], 20) == true) {
          done_drawing = true;
        }
        context.strokeStyle = "#df4b26";
        context.lineJoin = "round";
        context.lineWidth = 5;

        // Begin a path that we can fill when done
        context.beginPath();
        context.moveTo(shapes[currentShape].points[0].x, shapes[currentShape].points[0].y);
        for (var i = 0; i < shapes[currentShape].points.length; i++) {

          // Draw a line from current point to previous
            if (shapes[currentShape].points.length > 1) {
                context.lineTo(shapes[currentShape].points[i].x, shapes[currentShape].points[i].y);
            }

            // If we do not have a closed contour, keep drawing new circles
            if (!done_drawing)
            {
              context.arc(points[i].x, points[i].y, 5, 0, Math.PI * 2);
            }

            // Draw the lines
            context.stroke();

        }
        // Close the path
        context.closePath();

        // If we have a closed contour, color, add text, and create new shape
        if (done_drawing == true) {
          context.fillStyle = 'rgba(0,0,0,.2)';
            context.fill();
            shapes[currentShape].label = $('#label_txt').val();
          context.fillStyle = "rgba(0,0,255,1)";
          context.font = "30px Arial"
            context.fillText(shapes[currentShape].label, points[0].x, points[0].y-30); 

            newshape();
        }
    }

    // Check if two points  are close to each other
    function nearby(p1, p2, amount) {
        if ((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y) < amount * amount) {
            return true;
        } else {
            return false;
        }
    }

    // Add a new shape
    function newshape() {
      shapes.push(new Shape());
      currentShape = currentShape + 1;
    }
});

app.controller("dirCtrl", function($scope, $routeParams, $http) {
    $scope.dir = $routeParams.dir == undefined ? '/' : $routeParams.dir
    if ($scope.dir[0] != '/') $scope.dir = '/' + $scope.dir
    if ($scope.dir.length > 1 && $scope.dir[-1] != '/') $scope.dir += '/'

    // Just defaults for testing until API works
    $scope.children = ['test', 'test2']
    $scope.images = ['1', '2']

    $http.get("/api/dir" + $scope.img).then(
    function success(res) {
        if (res.object != "object") {
            console.warn('dir response is not json')
        }
        $scope.children = res.data['children'] === undefined ? [] : res.data['children']
        $scope.images = res.data['images'] == undefined ? [] : res.data['images']
    },
    function error(res) {
        console.warn('could not get directory', res.status, res.data)
    })

    $scope.reset = function () {
        $scope.label = $scope.old_label
    }
    console.log("dir");
});

app.controller("templateCtrl", function($scope, $routeParams, $http) {
    console.log("template");
    console.log($routeParams.template);
});
