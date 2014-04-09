module.exports = function(grunt){
  grunt.initConfig({
    browserify: {
      dist: {
        files: {
          "level-ndn.js": ["browser.js"]
        },
 	options: {
	  transform: ["workerify"] 
	}
      }
    },
    webdriver: {
      options: {
        host: 'ondemand.saucelabs.com',
        port: 80,
        user: "rynomadCSU",
        key: "c954c8b8-41ce-45b1-bba2-3b8806d5e2cf",
        desiredCapabilities: {
            browserName: 'chrome',
            version: '27',
            platform: 'XP',
            'tunnel-identifier': 'my-tunnel'
        }
      },
      chrome: {
          tests: ['mocha/test.js'],
          options: {
            // overwrite default settings
              desiredCapabilities: {
                  browserName: 'chrome'
              }
          }
      },  firefox: {
          tests: ['mocha/test.js'],
          options: {
            // overwrite default settings
              desiredCapabilities: {
                  browserName: 'firefox'
              }
          }
      }



    },
    mochaSelenium: {
      options: {
        // Mocha options
        reporter: 'spec',
        timeout: 30e3,
        // Toggles wd's promises API, default:false
        usePromises: false,
        useChrome: true
      },
      firefox: {
        src: ['test.js'],
        options: {
          host: "ondemand.saucelabs.com",
          port: 80,
          username: "rynomadCSU",
          accesskey: "c954c8b8-41ce-45b1-bba2-3b8806d5e2cf"
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-browserify') 
  grunt.loadNpmTasks('grunt-webdriver')
  grunt.registerTask('build', ['browserify', 'webdriver'])

}
