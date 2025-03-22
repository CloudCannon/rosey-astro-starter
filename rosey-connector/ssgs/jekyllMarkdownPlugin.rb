class Kramdown::Converter::Html
  def slugify(my_string)
    my_string
      .gsub(/[^a-zA-Z0-9]/, "-")
      .gsub(/[-]+/, "-")
      .gsub(/^-|-$/, "")
      .downcase
  end

  # You can override any function from this page:
  # https://kramdown.gettalong.org/rdoc/Kramdown/Converter/Html.html
  def format_as_block_html(name, attr, body, indent)
    "#{' ' * indent}<#{name}#{html_attributes(attr)} data-rosey='markdown:#{slugify(body)}'>#{body}</#{name}>\n"
  end
end

class Jekyll::Converters::Markdown::RoseyMarkdownProcessor
  def initialize(config)
    require 'kramdown'
    @config = config
  rescue LoadError
    STDERR.puts 'You are missing a library required for Markdown. Please run:'
    STDERR.puts '  $ [sudo] gem install kramdown'
    raise FatalException.new("Missing dependency: kramdown")
  end

  def convert(content)
    Kramdown::Document.new(content).to_html
  end
end
