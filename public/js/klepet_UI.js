function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  
  var jeSlika = sporocilo.indexOf('.jpg') > -1 || sporocilo.indexOf('.gif') > -1 || sporocilo.indexOf('.png') > -1;
  
  var jeVideo = sporocilo.indexOf('www.youtube.com/watch?v=') > -1;
  
  if(jeVideo){
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }
  if(jeSlika){
    // sporocilo = sporocilo.replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />').replace('gif\' /&gt;', 'gif\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }
  
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }
 
    else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  
  var tabela = sporocilo.split(".");
  for(var i = 0; i < tabela.length; i++){
    if(tabela[i] == "jpg" || "gif" || "png"){
      sporocilo = dodajSliko(sporocilo);
      break;
    }
  }
  
  
  
  sporocilo = dodajSmeske(sporocilo); //________________________________________________________________________________________
  
  if(sporocilo.indexOf('dregljaj')){
    
  }
  
  sporocilo = dodajVideo(sporocilo);
  
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }
  

  $('#poslji-sporocilo').val('');
}




var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});


  
function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);


  
  
  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });



    socket.on('dregljaj', function(rezultat){ // izbrisi!!!!!!!!!!!!
    console.log("izveden dregljaj");
    $('#vsebina').jrumble();
    $('#vsebina').trigger('startRumble');
    setTimeout(function(){
      $('#vsebina').trigger('stopRumble');
    }, 1500);
  });



  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function(){ // dodajanje implementacije za zasebno ______________________________________________________________________________________________
      var ime = $(this).text();
      
      $("#poslji-sporocilo").val('/zasebno "'+ ime + '" ');
      $("#poslji-sporocilo").focus();
    });
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});


  function dodajSliko(vhodnoBesedilo) {
    
  var scan = [];
  var slika = vhodnoBesedilo.match(new RegExp(/https?:\/\/.*?\.(jpg|png|gif)/gi));
  
  if(slika != null){
    
  
    for(var i = 0; i<slika.length; i++) {
      scan[i]= "<img src='"+ slika[i] + "' style='width:200px; margin-left:20px;' />";
    }
    
    vhodnoBesedilo += scan;
  }

  return vhodnoBesedilo;
}


function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}


function dodajVideo(vhodnoBesedilo){
  
  var scan = "";
  var video = vhodnoBesedilo.match(new RegExp(/(?:(?:http|https):\/\/www\.youtube\.com\/watch\?v=)(.{11})/gi));
  
  if(video != null){
    
  for(var i = 0; i < video.length; i++){
    
    //scan += "<iframe src='" + video[i] + "' style='width:200px; height:150px; mergin-left:20px' allowfullscreen></iframe>";
   
   var zacasno = video[i].substring(video[i].indexOf('watch?v') + 8);
   
      scan += "<iframe src='https://www.youtube.com/embed/" + zacasno + "'style='width:200px; height:150px; mergin-left:20px; allowfullscreen'></iframe>";
  }

  
  vhodnoBesedilo +=scan;
  
  }
  return vhodnoBesedilo;
}