.PHONY: commit

commit:
	@if [ ! -f .commit-msg ]; then echo "Error: .commit-msg not found"; exit 1; fi
	git add .
	git commit -m "$$(cat .commit-msg)"
	git status
	rm .commit-msg
