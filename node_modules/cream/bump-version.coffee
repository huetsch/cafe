fs = require 'fs'

bump_version_number = (package) ->
  version_nums = package['version'].split('.').map((x) -> Number x)
  last_num = version_nums[version_nums.length - 1]
  bumped_last_num = last_num + 1
  new_version_nums = version_nums[0...-1].concat([bumped_last_num])
  new_version_str = new_version_nums.join('.')
  package['version'] = new_version_str

write_package = (package) ->
  str = JSON.stringify package, null, 4
  fs.writeFileSync 'package.json', str

package = JSON.parse(new String(fs.readFileSync 'package.json').valueOf())

bump_version_number package
write_package package
